import { useState, useEffect, useRef } from 'react';
import { supabase, isAdmin, ASSETS_BUCKET_URL } from '../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import CustomAlert from '../components/CustomAlert';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const LOGO_URL = ASSETS_BUCKET_URL ? `${ASSETS_BUCKET_URL}/logo.png` : 'https://i.postimg.cc/J4t2GLWN/government-of-bangladesh-organization-public-sector-government-fc1aa96622361e91a0a538e6bce4bef9.png';
const WATERMARK_URL = ASSETS_BUCKET_URL ? `${ASSETS_BUCKET_URL}/watermark.png` : 'https://i.postimg.cc/G2hjVFLH/c583e512-b7bc-45ed-bed9-fa5b4c5060d7-removalai-preview.png';

const numberToWords = (num) => {
  const a = ['','One ','Two ','Three ','Four ','Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
  const b = ['', '', 'Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  if (num === 0) return 'Zero';
  if (num < 20) return a[num].trim();
  if (num < 100) return (b[Math.floor(num / 10)] + ' ' + a[num % 10]).trim();
  if (num < 1000) return (a[Math.floor(num / 100)] + 'Hundred ' + numberToWords(num % 100)).trim();
  if (num < 100000) return (numberToWords(Math.floor(num / 1000)) + ' Thousand ' + numberToWords(num % 1000)).trim();
  return num.toString();
};

const dateToWords = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const d = parseInt(day, 10);
  const m = months[parseInt(month, 10) - 1];
  const y = parseInt(year, 10);
  return `${numberToWords(d)} of ${m} ${numberToWords(y)}`;
};

const safe = (val) => (val === null || val === undefined ? '' : String(val));

export default function Admin() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('applications');

  const [alertState, setAlertState] = useState({ isOpen: false, message: '', type: 'success' });

  const [applications, setApplications] = useState([]);
  const [processingIds, setProcessingIds] = useState(new Set());
  const [selectedApp, setSelectedApp] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 🟢 প্রোগ্রেস ও QR/বারকোড স্টেট
  const [debugError, setDebugError] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [barcodeUrl, setBarcodeUrl] = useState(null);
  
  const printRef = useRef(null);

  // লোকেশন স্টেট
  const [locationList, setLocationList] = useState([]);
  const [newLoc, setNewLoc] = useState({ division_name: '', division_en: '', district_name: '', district_en: '', upazila_name: '', upazila_en: '', union_name: '', union_en: '' });
  const [isAddingLoc, setIsAddingLoc] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editLocData, setEditLocData] = useState({ id: '', division_name: '', division_en: '', district_name: '', district_en: '', upazila_name: '', upazila_en: '', union_name: '', union_en: '' });

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isAdmin(user.email)) { router.push('/admin/login'); return; }
      setUser(user);
      await fetchApplications();
      setLoading(false);
    };
    checkAdmin();
  }, []);

  useEffect(() => {
    if (activeTab === 'locations') fetchLocations();
  }, [activeTab]);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase.from('birth_applications').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setApplications(data || []);
    } catch (err) { setErrorMsg('ডেটা লোডে সমস্যা: ' + err.message); }
  };

  const fetchLocations = async () => {
    const { data } = await supabase.from('locations').select('*').order('created_at', { ascending: false });
    setLocationList(data || []);
  };

  const handleView = (app) => { setSelectedApp(app); setIsViewOpen(true); };

  const handleDeleteApp = async (id) => {
    if (!window.confirm('আপনি কি নিশ্চিতভাবে এই আবেদনটি ডিলিট করতে চান? এটি আর ফিরে পাওয়া যাবে না।')) return;
    try {
      const { error } = await supabase.from('birth_applications').delete().eq('id', id);
      if (error) throw error;
      setApplications(prev => prev.filter(app => app.id !== id));
      setAlertState({ isOpen: true, message: 'আবেদনটি সফলভাবে ডিলিট করা হয়েছে।', type: 'success' });
    } catch (err) { setDebugError('ডিলিটে সমস্যা: ' + err.message); }
  };

  const getImageAsBase64 = async (fileName) => {
    try {
      const { data, error } = await supabase.storage.from('certificate-assets').download(fileName);
      if (error) throw new Error(error.message);
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(data);
      });
    } catch (err) { throw new Error(`ছবি (${fileName}) লোড করতে সমস্যা: ` + err.message); }
  };

  const handleApprove = async (app) => {
    if (processingIds.has(app.id)) return;
    setProcessingIds(prev => new Set(prev).add(app.id));

    try {
      setDebugError('স্টেপ ১: ডাটা প্রস্তুত হচ্ছে...');
      setQrCodeUrl(null);
      setBarcodeUrl(null);
      setSelectedApp(app);
      await new Promise(r => setTimeout(r, 800));

      setDebugError('স্টেপ ২: QR ও বারকোড তৈরি হচ্ছে...');
      const qr = await QRCode.toDataURL(`https://verify.com/${app.tracking_id}`, { width: 256, margin: 1 });
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, app.tracking_id, { format: 'CODE128', displayValue: false, width: 2, height: 80, margin: 0 });
      const bar = canvas.toDataURL('image/png');
      
      setQrCodeUrl(qr);
      setBarcodeUrl(bar);
      await new Promise(r => setTimeout(r, 800)); // DOM আপডেট হওয়ার জন্য অপেক্ষা

      setDebugError('স্টেপ ৩: সার্টিফিকেট তৈরি হচ্ছে (মোবাইল ফ্রেন্ডলি)...');
      await new Promise(r => setTimeout(r, 500));

      const element = printRef.current;
      const canvasImg = await html2canvas(element, { scale: 2, useCORS: true, allowTaint: true });
      const imgData = canvasImg.toDataURL('image/jpeg', 0.95);
      
      setDebugError('স্টেপ ৪: PDF ফাইল তৈরি হচ্ছে...');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvasImg.height * pdfWidth) / canvasImg.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      const pdfBlob = pdf.output('blob');

      setDebugError('স্টেপ ৫: Supabase Storage-এ আপলোড হচ্ছে...');
      const filePath = `certificates/${app.tracking_id}.pdf`;
      const { error: uploadError } = await supabase.storage.from('certificates').upload(filePath, pdfBlob, { contentType: 'application/pdf', upsert: true });

      if (uploadError) throw new Error('আপলোড ব্যর্থ: ' + uploadError.message);

      setDebugError('স্টেপ ৬: ডাটাবেস আপডেট হচ্ছে...');
      const { data: publicUrlData } = supabase.storage.from('certificates').getPublicUrl(filePath);
      const pdfUrl = publicUrlData.publicUrl;

      const { error: updateError } = await supabase.from('birth_applications').update({ status: 'Approved', pdf_url: pdfUrl }).eq('id', app.id);

      if (updateError) throw new Error('ডাটাবেস ব্যর্থ: ' + updateError.message);

      setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: 'Approved', pdf_url: pdfUrl } : a));
      setDebugError('সফলভাবে সার্টিফিকেট তৈরি হয়েছে!');
      setTimeout(() => setDebugError(null), 3000);

    } catch (err) {
      console.error("Approve Flow Error:", err);
      setDebugError('এরর: ' + (err?.message || err.toString()));
    } finally {
      setProcessingIds(prev => { const next = new Set(prev); next.delete(app.id); return next; });
    }
  };

  const handleDownload = async (app) => {
    if (!app.pdf_url) return;
    try {
      const res = await fetch(app.pdf_url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Certificate-${app.tracking_id}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch (e) { window.open(app.pdf_url, '_blank'); }
  };

  const handleAddLocation = async (e) => {
    e.preventDefault();
    if (!newLoc.division_name || !newLoc.district_name) return setDebugError('বিভাগ ও জেলা অবশ্যই দিতে হবে।');
    setIsAddingLoc(true);
    const { error } = await supabase.from('locations').insert([newLoc]);
    setIsAddingLoc(false);
    if (error) return setDebugError('সেভ করতে সমস্যা: ' + error.message);
    setAlertState({ isOpen: true, message: 'লোকেশন সফলভাবে সেভ হয়েছে!', type: 'success' });
    setNewLoc({ division_name: '', division_en: '', district_name: '', district_en: '', upazila_name: '', upazila_en: '', union_name: '', union_en: '' });
    fetchLocations();
  };

  const handleDeleteLocation = async (id) => {
    if (!window.confirm('লোকেশনটি ডিলিট করতে চান?')) return;
    const { error } = await supabase.from('locations').delete().eq('id', id);
    if (error) setDebugError('ডিলিটে সমস্যা: ' + error.message);
    else { setAlertState({ isOpen: true, message: 'লোকেশন ডিলিট করা হয়েছে।', type: 'success' }); fetchLocations(); }
  };

  const handleOpenEdit = (loc) => { setEditLocData(loc); setIsEditModalOpen(true); };

  const handleUpdateLocation = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('locations').update({
        division_name: editLocData.division_name, division_en: editLocData.division_en,
        district_name: editLocData.district_name, district_en: editLocData.district_en,
        upazila_name: editLocData.upazila_name, upazila_en: editLocData.upazila_en,
        union_name: editLocData.union_name, union_en: editLocData.union_en,
      }).eq('id', editLocData.id);
      if (error) throw error;
      setAlertState({ isOpen: true, message: 'লোকেশন সফলভাবে আপডেট হয়েছে!', type: 'success' });
      setIsEditModalOpen(false); fetchLocations();
    } catch (err) { setDebugError('আপডেটে সমস্যা: ' + err.message); }
  };

  const filteredApps = applications.filter(app =>
    (app.tracking_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (app.first_name_bn || '').includes(searchQuery) ||
    (app.first_name_en || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalApps = applications.length;
  const pendingApps = applications.filter(a => a.status === 'Pending').length;
  const approvedApps = applications.filter(a => a.status === 'Approved').length;
  const inputClass = "w-full mt-1 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm text-gray-700 bg-gray-50 focus:bg-white";

  if (loading) return <div className="text-center mt-20 text-lg font-bold">লোড হচ্ছে...</div>;

  return (
    <div className="min-h-screen bg-gray-100 font-sans relative">
      
      {debugError && (
        <div className="fixed top-0 left-0 w-full bg-red-600 text-white p-4 z-[9999] shadow-xl flex justify-between items-start">
          <div className="flex flex-col">
            <span className="font-bold text-lg mb-1">⏳ প্রোগ্রেস / এরর:</span>
            <span className="text-sm break-all font-semibold">{debugError}</span>
          </div>
          <button onClick={() => setDebugError(null)} className="bg-red-800 hover:bg-red-900 text-white font-bold py-1 px-3 rounded ml-2 whitespace-nowrap">বন্ধ করুন</button>
        </div>
      )}

      <nav className="bg-gray-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="Logo" className="w-8 h-8 bg-white rounded-full p-1" />
            <h1 className="text-lg font-bold">অ্যাডমিন ড্যাশবোর্ড</h1>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden md:inline text-gray-400">{user?.email}</span>
            <Link href="/" className="bg-gray-700 px-3 py-1.5 rounded hover:bg-gray-600 transition hidden md:inline">← মেইন সাইট</Link>
            <button onClick={async () => { await supabase.auth.signOut(); router.push('/admin/login'); }} className="bg-red-600 px-3 py-1.5 rounded hover:bg-red-700 transition">লগআউট</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-600"><p className="text-gray-500 text-sm font-medium">মোট আবেদন</p><h3 className="text-3xl font-bold text-gray-800 mt-1">{totalApps}</h3></div>
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-yellow-500"><p className="text-gray-500 text-sm font-medium">অপেক্ষমাণ (Pending)</p><h3 className="text-3xl font-bold text-gray-800 mt-1">{pendingApps}</h3></div>
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-600"><p className="text-gray-500 text-sm font-medium">অনুমোদিত (Approved)</p><h3 className="text-3xl font-bold text-gray-800 mt-1">{approvedApps}</h3></div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="flex border-b bg-gray-50">
            <button onClick={() => setActiveTab('applications')} className={`px-6 py-4 font-bold text-sm flex items-center gap-2 transition-colors ${activeTab === 'applications' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-500 hover:text-gray-800'}`}>
              <span>আবেদনসমূহ</span>
              <span className="bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs">{totalApps}</span>
            </button>
            <button onClick={() => setActiveTab('locations')} className={`px-6 py-4 font-bold text-sm flex items-center gap-2 transition-colors ${activeTab === 'locations' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-500 hover:text-gray-800'}`}>
              <span>লোকেশন ম্যানেজার</span>
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'applications' && (
              <>
                {errorMsg && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{errorMsg}</div>}
                <div className="mb-4 flex justify-between items-center">
                  <input type="text" placeholder="ট্র্যাকিং আইডি বা নাম দিয়ে খুঁজুন..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={inputClass + ' md:w-1/2'} />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border">
                    <thead className="bg-gray-100 text-gray-700">
                      <tr>
                        <th className="px-4 py-3 border-b">ট্র্যাকিং আইডি</th>
                        <th className="px-4 py-3 border-b">আবেদনকারীর নাম</th>
                        <th className="px-4 py-3 border-b">তারিখ</th>
                        <th className="px-4 py-3 border-b">স্ট্যাটাস</th>
                        <th className="px-4 py-3 border-b text-center">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredApps.length === 0 ? (
                        <tr><td colSpan="5" className="text-center py-8 text-gray-500">কোনো আবেদন পাওয়া যায়নি।</td></tr>
                      ) : (
                        filteredApps.map(app => {
                          const busy = processingIds.has(app.id);
                          return (
                            <tr key={app.id} className="border-b hover:bg-gray-50">
                              <td className="px-4 py-3 font-mono font-bold text-blue-600">{app.tracking_id}</td>
                              <td className="px-4 py-3">
                                <p className="font-medium text-gray-800">{app.first_name_bn} {app.last_name_bn}</p>
                                <p className="text-xs text-gray-500">{app.first_name_en} {app.last_name_en}</p>
                              </td>
                              <td className="px-4 py-3 text-gray-600">{new Date(app.created_at).toLocaleDateString('en-GB')}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 text-white rounded text-xs font-bold ${app.status === 'Pending' ? 'bg-yellow-500' : 'bg-green-600'}`}>
                                  {app.status === 'Pending' ? 'Pending' : 'Approved'}
                                </span>
                              </td>
                              <td className="px-4 py-3 flex flex-wrap justify-center gap-2">
                                <button onClick={() => handleView(app)} className="px-3 py-1 bg-gray-600 text-white rounded text-xs font-bold hover:bg-gray-700 transition">View</button>
                                {app.status === 'Pending' ? (
                                  <button onClick={() => handleApprove(app)} disabled={busy} className={`px-3 py-1 text-white rounded text-xs font-bold transition ${busy ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                    {busy ? 'তৈরি হচ্ছে...' : 'Approve'}
                                  </button>
                                ) : (
                                  app.pdf_url ? (
                                    <button onClick={() => handleDownload(app)} className="px-3 py-1 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-700 transition">Download</button>
                                  ) : (
                                    <button onClick={() => handleApprove(app)} disabled={busy} className={`px-3 py-1 text-white rounded text-xs font-bold transition ${busy ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                      {busy ? 'তৈরি হচ্ছে...' : 'Regenerate'}
                                    </button>
                                  )
                                )}
                                <button onClick={() => handleDeleteApp(app.id)} className="px-3 py-1 bg-red-600 text-white rounded text-xs font-bold hover:bg-red-700 transition">Delete</button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {activeTab === 'locations' && (
              <div className="space-y-8">
                <form onSubmit={handleAddLocation} className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <h3 className="font-bold text-lg mb-4 text-blue-800">নতুন লোকেশন যুক্ত করুন</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="text-sm font-medium">বিভাগ (বাংলা) *</label><input value={newLoc.division_name} onChange={(e) => setNewLoc({ ...newLoc, division_name: e.target.value })} className={inputClass} required /></div>
                    <div><label className="text-sm font-medium">Division (English) *</label><input value={newLoc.division_en} onChange={(e) => setNewLoc({ ...newLoc, division_en: e.target.value })} className={inputClass} required /></div>
                    <div><label className="text-sm font-medium">জেলা (বাংলা) *</label><input value={newLoc.district_name} onChange={(e) => setNewLoc({ ...newLoc, district_name: e.target.value })} className={inputClass} required /></div>
                    <div><label className="text-sm font-medium">District (English) *</label><input value={newLoc.district_en} onChange={(e) => setNewLoc({ ...newLoc, district_en: e.target.value })} className={inputClass} required /></div>
                    <div><label className="text-sm font-medium">উপজেলা (বাংলা)</label><input value={newLoc.upazila_name} onChange={(e) => setNewLoc({ ...newLoc, upazila_name: e.target.value })} className={inputClass} /></div>
                    <div><label className="text-sm font-medium">Upazila (English)</label><input value={newLoc.upazila_en} onChange={(e) => setNewLoc({ ...newLoc, upazila_en: e.target.value })} className={inputClass} /></div>
                    <div><label className="text-sm font-medium">ইউনিয়ন/পৌরসভা (বাংলা)</label><input value={newLoc.union_name} onChange={(e) => setNewLoc({ ...newLoc, union_name: e.target.value })} className={inputClass} /></div>
                    <div><label className="text-sm font-medium">Union/Paurshava (English)</label><input value={newLoc.union_en} onChange={(e) => setNewLoc({ ...newLoc, union_en: e.target.value })} className={inputClass} /></div>
                  </div>
                  <button type="submit" disabled={isAddingLoc} className="mt-6 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition shadow disabled:bg-gray-400">{isAddingLoc ? 'সেভ হচ্ছে...' : 'সেভ করুন'}</button>
                </form>

                <div>
                  <h3 className="font-bold text-lg mb-2">সেভ করা লোকেশন তালিকা ({locationList.length})</h3>
                  <div className="overflow-x-auto max-h-[500px] overflow-y-auto border rounded-lg">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-200 sticky top-0 z-10">
                        <tr><th className="px-4 py-3">বিভাগ</th><th className="px-4 py-3">জেলা</th><th className="px-4 py-3">উপজেলা</th><th className="px-4 py-3">ইউনিয়ন/পৌরসভা</th><th className="px-4 py-3">অ্যাকশন</th></tr>
                      </thead>
                      <tbody>
                        {locationList.map(loc => (
                          <tr key={loc.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-2">{loc.division_name} <span className="text-gray-400 text-xs">({loc.division_en})</span></td>
                            <td className="px-4 py-2">{loc.district_name} <span className="text-gray-400 text-xs">({loc.district_en})</span></td>
                            <td className="px-4 py-2">{loc.upazila_name} <span className="text-gray-400 text-xs">({loc.upazila_en})</span></td>
                            <td className="px-4 py-2">{loc.union_name} <span className="text-gray-400 text-xs">({loc.union_en})</span></td>
                            <td className="px-4 py-2 flex gap-3">
                              <button onClick={() => handleOpenEdit(loc)} className="text-blue-600 font-bold hover:underline">এডিট</button>
                              <button onClick={() => handleDeleteLocation(loc.id)} className="text-red-600 font-bold hover:underline">ডিলিট</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isViewOpen && selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b bg-gray-50 sticky top-0">
              <h3 className="text-lg font-bold text-gray-800">আবেদনকারীর বিস্তারিত তথ্য</h3>
              <button onClick={() => setIsViewOpen(false)} className="text-gray-500 hover:text-red-600 font-bold text-2xl">&times;</button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h4 className="font-bold text-green-700 border-b pb-1 mb-3">মৌলিক তথ্য</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <p><strong>ট্র্যাকিং আইডি:</strong> {selectedApp.tracking_id}</p>
                  <p><strong>জন্ম তারিখ:</strong> {selectedApp.dob}</p>
                  <p><strong>নাম (বাংলা):</strong> {selectedApp.first_name_bn} {selectedApp.last_name_bn}</p>
                  <p><strong>নাম (ইংরেজি):</strong> {selectedApp.first_name_en} {selectedApp.last_name_en}</p>
                  <p><strong>লিঙ্গ:</strong> {selectedApp.gender}</p>
                  <p><strong>সন্তান ক্রম:</strong> {selectedApp.child_order}</p>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-green-700 border-b pb-1 mb-3">পিতা-মাতার তথ্য</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <p><strong>পিতার নাম:</strong> {selectedApp.father_name_bn} ({selectedApp.father_name_en})</p>
                  <p><strong>মাতার নাম:</strong> {selectedApp.mother_name_bn} ({selectedApp.mother_name_en})</p>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-green-700 border-b pb-1 mb-3">ঠিকানার তথ্য</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <p><strong>বিভাগ:</strong> {selectedApp.division} ({selectedApp.division_en})</p>
                  <p><strong>জেলা:</strong> {selectedApp.district} ({selectedApp.district_en})</p>
                  <p><strong>উপজেলা:</strong> {selectedApp.city_corp} ({selectedApp.upazila_en})</p>
                  <p><strong>ইউনিয়ন/পৌরসভা:</strong> {selectedApp.union_name} ({selectedApp.union_en})</p>
                  <p><strong>ওয়ার্ড:</strong> {selectedApp.ward}</p>
                  <p><strong>গ্রাম/মহল্লা:</strong> {selectedApp.village_bn} ({selectedApp.village_en})</p>
                  <p><strong>ডাকঘর:</strong> {selectedApp.post_office_bn} ({selectedApp.post_office_en})</p>
                </div>
              </div>
              <div className="flex justify-between items-center bg-gray-100 p-3 rounded mt-4">
                <p><strong>স্ট্যাটাস:</strong> <span className={`px-2 py-1 text-white rounded text-xs font-bold ${selectedApp.status === 'Pending' ? 'bg-yellow-500' : 'bg-green-600'}`}>{selectedApp.status}</span></p>
                <p><strong>তারিখ:</strong> {new Date(selectedApp.created_at).toLocaleDateString('en-GB')}</p>
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 text-right">
              <button onClick={() => setIsViewOpen(false)} className="px-6 py-2 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-700 transition">বন্ধ করুন</button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[90] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b bg-gray-50 sticky top-0">
              <h3 className="text-lg font-bold text-gray-800">লোকেশন আপডেট করুন</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-red-600 font-bold text-2xl">&times;</button>
            </div>
            <form onSubmit={handleUpdateLocation} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-sm font-medium">বিভাগ (বাংলা) *</label><input value={editLocData.division_name || ''} onChange={(e) => setEditLocData({ ...editLocData, division_name: e.target.value })} className={inputClass} required /></div>
                <div><label className="text-sm font-medium">Division (English) *</label><input value={editLocData.division_en || ''} onChange={(e) => setEditLocData({ ...editLocData, division_en: e.target.value })} className={inputClass} required /></div>
                <div><label className="text-sm font-medium">জেলা (বাংলা) *</label><input value={editLocData.district_name || ''} onChange={(e) => setEditLocData({ ...editLocData, district_name: e.target.value })} className={inputClass} required /></div>
                <div><label className="text-sm font-medium">District (English) *</label><input value={editLocData.district_en || ''} onChange={(e) => setEditLocData({ ...editLocData, district_en: e.target.value })} className={inputClass} required /></div>
                <div><label className="text-sm font-medium">উপজেলা (বাংলা)</label><input value={editLocData.upazila_name || ''} onChange={(e) => setEditLocData({ ...editLocData, upazila_name: e.target.value })} className={inputClass} /></div>
                <div><label className="text-sm font-medium">Upazila (English)</label><input value={editLocData.upazila_en || ''} onChange={(e) => setEditLocData({ ...editLocData, upazila_en: e.target.value })} className={inputClass} /></div>
                <div><label className="text-sm font-medium">ইউনিয়ন/পৌরসভা (বাংলা)</label><input value={editLocData.union_name || ''} onChange={(e) => setEditLocData({ ...editLocData, union_name: e.target.value })} className={inputClass} /></div>
                <div><label className="text-sm font-medium">Union/Paurshava (English)</label><input value={editLocData.union_en || ''} onChange={(e) => setEditLocData({ ...editLocData, union_en: e.target.value })} className={inputClass} /></div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-6 py-2 bg-gray-400 text-white rounded-lg font-bold hover:bg-gray-500 transition">বাতিল</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition shadow">আপডেট করুন</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <CustomAlert isOpen={alertState.isOpen} message={alertState.message} type={alertState.type} onClose={() => setAlertState({ ...alertState, isOpen: false })} />

      {/* 🟢 হিডেন ডিভ (QR ও বারকোড সহ, ছবির মতো হুবহু ডিজাইন) */}
      {selectedApp && (
        <div style={{ position: 'absolute', top: '-10000px', left: '-10000px' }}>
          <div ref={printRef} style={{ width: '800px', minHeight: '1130px', padding: '50px 60px', backgroundColor: '#ffffff', color: '#000000', fontFamily: 'Arial, sans-serif', position: 'relative', boxSizing: 'border-box' }}>
            
            {/* ওয়াটারমার্ক */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -45%)', opacity: 0.15, zIndex: 0, pointerEvents: 'none', textAlign: 'center' }}>
              <img src={WATERMARK_URL} alt="Watermark" style={{ width: '650px' }} crossOrigin="anonymous" />
            </div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              
              {/* হেডার সেকশন */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                
                {/* QR CODE */}
                <div style={{ width: '120px', textAlign: 'center', marginTop: '10px' }}>
                  {qrCodeUrl && <img id="qr-img" src={qrCodeUrl} alt="QR" style={{ width: '110px', height: '110px', margin: '0 auto', display: 'block' }} />}
                  <p style={{ fontSize: '13px', marginTop: '8px', fontWeight: 'bold', letterSpacing: '1px', color: '#555' }}>AEIZ</p>
                </div>
                
                {/* সেন্টার লোগো ও নাম */}
                <div style={{ flex: 1, textAlign: 'center', padding: '0 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <img src={LOGO_URL} alt="Logo" style={{ width: '75px', margin: '0 auto 10px auto', display: 'block' }} crossOrigin="anonymous" />
                  <h1 style={{ fontSize: '17px', fontWeight: 'bold', margin: '0 0 5px 0', color: '#333' }}>Government of the People's Republic of Bangladesh</h1>
                  <p style={{ fontSize: '13px', margin: '0 0 10px 0', color: '#444' }}>Office of the Register, Birth and Death Registration</p>
                  
                  {/* ২ লাইনে ঠিকানা */}
                  <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: '500', color: '#222', lineHeight: '1.4' }}>
                    <p style={{ margin: 0 }}>
                      {safe(selectedApp.union_en || selectedApp.union_name)}
                    </p>
                    <p style={{ margin: 0 }}>
                      {safe(selectedApp.upazila_en || selectedApp.city_corp)}, {safe(selectedApp.district_en || selectedApp.district)}
                    </p>
                  </div>
                  <p style={{ fontSize: '11px', margin: '5px 0 0 0', color: '#555' }}>(Rule 9, 10)</p>
                </div>
                
                {/* বারকোড */}
                <div style={{ width: '150px', textAlign: 'right', marginTop: '15px' }}>
                  {barcodeUrl && <img id="barcode-img" src={barcodeUrl} alt="Barcode" style={{ width: '150px', height: '45px' }} />}
                </div>
              </div>

              {/* টাইটেল */}
              <h2 style={{ fontSize: '21px', fontWeight: 'bold', textAlign: 'center', margin: '20px 0 25px 0', fontFamily: 'Noto Sans Bengali, Arial, sans-serif', color: '#111' }}>
                জন্ম নিবন্ধন সনদ / Birth Registration Certificate
              </h2>

              {/* রেজিস্ট্রেশন নম্বর সেকশন */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', fontSize: '12px' }}>
                <div style={{ width: '30%' }}>
                  <p style={{ fontWeight: 'bold', margin: '0 0 5px 0', color: '#333' }}>Date of Registration</p>
                  <p style={{ margin: 0, color: '#444' }}>{new Date().toLocaleDateString('en-GB')}</p>
                </div>
                <div style={{ width: '40%', textAlign: 'center' }}>
                  <p style={{ fontWeight: 'bold', margin: '0 0 5px 0', color: '#333' }}>Birth Registration Number</p>
                  <p style={{ fontWeight: 'bold', fontSize: '16px', margin: 0, color: '#111' }}>{selectedApp.tracking_id}</p>
                </div>
                <div style={{ width: '30%', textAlign: 'right' }}>
                  <p style={{ fontWeight: 'bold', margin: '0 0 5px 0', color: '#333' }}>Date of Issuance</p>
                  <p style={{ margin: 0, color: '#444' }}>{new Date().toLocaleDateString('en-GB')}</p>
                </div>
              </div>

              {/* ডাটা টেবিল */}
              <div style={{ fontSize: '13px', lineHeight: '2', color: '#222' }}>
                <div style={{ display: 'flex', marginBottom: '5px' }}>
                  <div style={{ width: '18%' }}>Date of Birth</div>
                  <div style={{ width: '35%' }}>: {selectedApp.dob}</div>
                  <div style={{ width: '12%' }}>Sex</div>
                  <div style={{ width: '35%' }}>: {selectedApp.gender === 'পুরুষ' ? 'Male' : selectedApp.gender === 'মহিলা' ? 'Female' : 'Hijra'}</div>
                </div>
                <div style={{ display: 'flex', marginBottom: '20px' }}>
                  <div style={{ width: '18%' }}>In Word</div>
                  <div style={{ width: '82%' }}>: {dateToWords(selectedApp.dob)}</div>
                </div>

                <div style={{ display: 'flex', marginBottom: '8px' }}>
                  <div style={{ width: '18%', fontFamily: 'Noto Sans Bengali, sans-serif' }}>নাম</div>
                  <div style={{ width: '32%', fontFamily: 'Noto Sans Bengali, sans-serif' }}>: {selectedApp.first_name_bn} {selectedApp.last_name_bn}</div>
                  <div style={{ width: '15%' }}>Name</div>
                  <div style={{ width: '35%' }}>: {selectedApp.first_name_en} {selectedApp.last_name_en}</div>
                </div>
                <div style={{ display: 'flex', marginBottom: '8px' }}>
                  <div style={{ width: '18%', fontFamily: 'Noto Sans Bengali, sans-serif' }}>মাতা</div>
                  <div style={{ width: '32%', fontFamily: 'Noto Sans Bengali, sans-serif' }}>: {selectedApp.mother_name_bn}</div>
                  <div style={{ width: '15%' }}>Mother</div>
                  <div style={{ width: '35%' }}>: {selectedApp.mother_name_en}</div>
                </div>
                <div style={{ display: 'flex', marginBottom: '8px' }}>
                  <div style={{ width: '18%', fontFamily: 'Noto Sans Bengali, sans-serif' }}>মাতার জাতীয়তা</div>
                  <div style={{ width: '32%', fontFamily: 'Noto Sans Bengali, sans-serif' }}>: বাংলাদেশী</div>
                  <div style={{ width: '15%' }}>Nationality</div>
                  <div style={{ width: '35%' }}>: Bangladeshi</div>
                </div>
                <div style={{ display: 'flex', marginBottom: '8px' }}>
                  <div style={{ width: '18%', fontFamily: 'Noto Sans Bengali, sans-serif' }}>পিতা</div>
                  <div style={{ width: '32%', fontFamily: 'Noto Sans Bengali, sans-serif' }}>: {selectedApp.father_name_bn}</div>
                  <div style={{ width: '15%' }}>Father</div>
                  <div style={{ width: '35%' }}>: {selectedApp.father_name_en}</div>
                </div>
                <div style={{ display: 'flex', marginBottom: '8px' }}>
                  <div style={{ width: '18%', fontFamily: 'Noto Sans Bengali, sans-serif' }}>পিতার জাতীয়তা</div>
                  <div style={{ width: '32%', fontFamily: 'Noto Sans Bengali, sans-serif' }}>: বাংলাদেশী</div>
                  <div style={{ width: '15%' }}>Nationality</div>
                  <div style={{ width: '35%' }}>: Bangladeshi</div>
                </div>
                <div style={{ display: 'flex', marginBottom: '8px' }}>
                  <div style={{ width: '18%', fontFamily: 'Noto Sans Bengali, sans-serif' }}>জন্মস্থান</div>
                  <div style={{ width: '32%', fontFamily: 'Noto Sans Bengali, sans-serif' }}>: {selectedApp.village_bn}, {selectedApp.district}, বাংলাদেশ</div>
                  <div style={{ width: '15%' }}>Place of Birth</div>
                  <div style={{ width: '35%' }}>: {selectedApp.village_en}, {selectedApp.district_en || selectedApp.district}, Bangladesh</div>
                </div>
                <div style={{ display: 'flex', marginBottom: '8px' }}>
                  <div style={{ width: '18%', fontFamily: 'Noto Sans Bengali, sans-serif' }}>স্থায়ী ঠিকানা</div>
                  <div style={{ width: '32%', fontFamily: 'Noto Sans Bengali, sans-serif' }}>: {selectedApp.house_road_bn}, {selectedApp.village_bn}, {selectedApp.post_office_bn}, {selectedApp.district}।</div>
                  <div style={{ width: '15%' }}>Permanent<br/>Address</div>
                  <div style={{ width: '35%' }}>: {selectedApp.house_road_en}, {selectedApp.village_en}, {selectedApp.post_office_en}, {selectedApp.district_en || selectedApp.district}.</div>
                </div>
              </div>

              {/* সিল ও সিগনেচার সেকশন */}
              <div style={{ marginTop: '100px', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <div style={{ width: '40%' }}>
                  <p style={{ fontWeight: 'bold', borderTop: '1px solid #000', paddingTop: '8px', display: 'inline-block', margin: 0, color: '#111' }}>Seal & Signature</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#444' }}>Assistant to Registrar</p>
                </div>
                <div style={{ width: '40%', textAlign: 'right' }}>
                  <p style={{ fontWeight: 'bold', borderTop: '1px solid #000', paddingTop: '8px', display: 'inline-block', margin: 0, color: '#111' }}>Seal & Signature</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#444' }}>Registrar</p>
                </div>
              </div>
              
              {/* ফুটার টেক্সট */}
              <div style={{ textAlign: 'center', fontSize: '10px', marginTop: '40px', color: '#555', letterSpacing: '0.5px' }}>
                This certificate is generated from bdris.gov.bd and to verify this certificate. please scan the above QR Code & Bar Code
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}