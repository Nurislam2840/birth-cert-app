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
  const [activeTab, setActiveTab] = useState('applications');

  const [alertState, setAlertState] = useState({ isOpen: false, message: '', type: 'success' });
  const [debugError, setDebugError] = useState(null);

  // অ্যাপ্লিকেশন স্টেট
  const [applications, setApplications] = useState([]);
  const [processingIds, setProcessingIds] = useState(new Set());
  const [selectedApp, setSelectedApp] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [barcodeUrl, setBarcodeUrl] = useState(null);
  const printRef = useRef(null);

  // লোকেশন স্টেট
  const [locTab, setLocTab] = useState('divisions');
  const [divisions, setDivisions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [upazilas, setUpazilas] = useState([]);
  const [unions, setUnions] = useState([]);

  const [newDiv, setNewDiv] = useState({ name_bn: '', name_en: '' });
  const [newDist, setNewDist] = useState({ division_id: '', name_bn: '', name_en: '' });
  const [newUpa, setNewUpa] = useState({ district_id: '', name_bn: '', name_en: '' });
  const [newUni, setNewUni] = useState({ upazila_id: '', name_bn: '', name_en: '' });

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isAdmin(user.email)) { router.push('/admin/login'); return; }
      setUser(user);
      await fetchApplications();
      await fetchAllLocations();
      setLoading(false);
    };
    checkAdmin();
  }, []);

  const fetchAllLocations = async () => {
    const [divRes, distRes, upaRes, uniRes] = await Promise.all([
      supabase.from('divisions').select('*').order('id'),
      supabase.from('districts').select('*').order('id'),
      supabase.from('upazilas').select('*').order('id'),
      supabase.from('unions').select('*').order('id')
    ]);
    setDivisions(divRes.data || []);
    setDistricts(distRes.data || []);
    setUpazilas(upaRes.data || []);
    setUnions(uniRes.data || []);
  };

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase.from('birth_applications').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setApplications(data || []);
    } catch (err) { setDebugError('ডেটা লোডে সমস্যা: ' + err.message); }
  };

  // লোকেশন অ্যাড ফাংশন
  const handleAddDivision = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('divisions').insert([newDiv]);
    if (error) return setDebugError(error.message);
    setAlertState({ isOpen: true, message: 'বিভাগ সেভ হয়েছে!', type: 'success' });
    setNewDiv({ name_bn: '', name_en: '' });
    fetchAllLocations();
  };

  const handleAddDistrict = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('districts').insert([{ ...newDist, division_id: parseInt(newDist.division_id) }]);
    if (error) return setDebugError(error.message);
    setAlertState({ isOpen: true, message: 'জেলা সেভ হয়েছে!', type: 'success' });
    setNewDist({ ...newDist, name_bn: '', name_en: '' });
    fetchAllLocations();
  };

  const handleAddUpazila = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('upazilas').insert([{ ...newUpa, district_id: parseInt(newUpa.district_id) }]);
    if (error) return setDebugError(error.message);
    setAlertState({ isOpen: true, message: 'উপজেলা সেভ হয়েছে!', type: 'success' });
    setNewUpa({ ...newUpa, name_bn: '', name_en: '' });
    fetchAllLocations();
  };

  const handleAddUnion = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('unions').insert([{ ...newUni, upazila_id: parseInt(newUni.upazila_id) }]);
    if (error) return setDebugError(error.message);
    setAlertState({ isOpen: true, message: 'ইউনিয়ন সেভ হয়েছে!', type: 'success' });
    setNewUni({ ...newUni, name_bn: '', name_en: '' });
    fetchAllLocations();
  };

  // PDF জেনারেশন (আগের মতোই)
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
      await new Promise(r => setTimeout(r, 800));

      setDebugError('স্টেপ ৩: সার্টিফিকেট তৈরি হচ্ছে...');
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

      const { data: publicUrlData } = supabase.storage.from('certificates').getPublicUrl(filePath);
      const pdfUrl = publicUrlData.publicUrl;

      const { error: updateError } = await supabase.from('birth_applications').update({ status: 'Approved', pdf_url: pdfUrl }).eq('id', app.id);
      if (updateError) throw new Error('ডাটাবেস ব্যর্থ: ' + updateError.message);

      setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: 'Approved', pdf_url: pdfUrl } : a));
      setDebugError('সফলভাবে সার্টিফিকেট তৈরি হয়েছে!');
      setTimeout(() => setDebugError(null), 3000);

    } catch (err) {
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
      a.href = url; a.download = `Certificate-${app.tracking_id}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch (e) { window.open(app.pdf_url, '_blank'); }
  };

  const inputClass = "w-full p-2 border border-gray-300 rounded-lg text-sm";

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
        <div className="flex border-b bg-white rounded-t-xl overflow-hidden mb-6">
          <button onClick={() => setActiveTab('applications')} className={`px-6 py-4 font-bold text-sm ${activeTab === 'applications' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>আবেদনসমূহ</button>
          <button onClick={() => setActiveTab('locations')} className={`px-6 py-4 font-bold text-sm ${activeTab === 'locations' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>লোকেশন ম্যানেজার</button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          {activeTab === 'applications' && (
            <>
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
                    {applications.filter(app => (app.tracking_id || '').includes(searchQuery)).map(app => {
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
                            <button onClick={() => { setSelectedApp(app); setIsViewOpen(true); }} className="px-3 py-1 bg-gray-600 text-white rounded text-xs font-bold hover:bg-gray-700">View</button>
                            {app.status === 'Pending' ? (
                              <button onClick={() => handleApprove(app)} disabled={busy} className={`px-3 py-1 text-white rounded text-xs font-bold ${busy ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                {busy ? 'তৈরি হচ্ছে...' : 'Approve'}
                              </button>
                            ) : (
                              app.pdf_url && (
                                <button onClick={() => handleDownload(app)} className="px-3 py-1 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-700">Download</button>
                              )
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'locations' && (
            <div>
              <div className="flex border-b mb-6 space-x-4 overflow-x-auto">
                <button onClick={() => setLocTab('divisions')} className={`pb-2 font-bold whitespace-nowrap ${locTab === 'divisions' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500'}`}>১. বিভাগ</button>
                <button onClick={() => setLocTab('districts')} className={`pb-2 font-bold whitespace-nowrap ${locTab === 'districts' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500'}`}>২. জেলা</button>
                <button onClick={() => setLocTab('upazilas')} className={`pb-2 font-bold whitespace-nowrap ${locTab === 'upazilas' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500'}`}>৩. উপজেলা</button>
                <button onClick={() => setLocTab('unions')} className={`pb-2 font-bold whitespace-nowrap ${locTab === 'unions' ? 'border-b-2 border-green-600 text-green-700' : 'text-gray-500'}`}>৪. ইউনিয়ন/পৌরসভা</button>
              </div>

              {locTab === 'divisions' && (
                <div>
                  <form onSubmit={handleAddDivision} className="flex flex-col md:flex-row gap-4 mb-6 items-end bg-gray-50 p-4 rounded-lg border">
                    <div className="flex-1 w-full"><label className="text-sm font-bold">বিভাগ (বাংলা)</label><input value={newDiv.name_bn} onChange={e => setNewDiv({...newDiv, name_bn: e.target.value})} className={inputClass} required/></div>
                    <div className="flex-1 w-full"><label className="text-sm font-bold">Division (English)</label><input value={newDiv.name_en} onChange={e => setNewDiv({...newDiv, name_en: e.target.value})} className={inputClass} required/></div>
                    <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">যোগ করুন</button>
                  </form>
                  <ul className="divide-y border rounded-lg">
                    {divisions.map(d => <li key={d.id} className="p-3 flex justify-between"><span>{d.name_bn} ({d.name_en})</span></li>)}
                  </ul>
                </div>
              )}

              {locTab === 'districts' && (
                <div>
                  <form onSubmit={handleAddDistrict} className="flex flex-col md:flex-row gap-4 mb-6 items-end bg-gray-50 p-4 rounded-lg border">
                    <div className="flex-1 w-full"><label className="text-sm font-bold">বিভাগ</label>
                    <select value={newDist.division_id} onChange={e => setNewDist({...newDist, division_id: e.target.value})} className={inputClass} required>
                      <option value="">নির্বাচন করুন</option>
                      {divisions.map(d => <option key={d.id} value={d.id}>{d.name_bn}</option>)}
                    </select></div>
                    <div className="flex-1 w-full"><label className="text-sm font-bold">জেলা (বাংলা)</label><input value={newDist.name_bn} onChange={e => setNewDist({...newDist, name_bn: e.target.value})} className={inputClass} required/></div>
                    <div className="flex-1 w-full"><label className="text-sm font-bold">District (English)</label><input value={newDist.name_en} onChange={e => setNewDist({...newDist, name_en: e.target.value})} className={inputClass} required/></div>
                    <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">যোগ করুন</button>
                  </form>
                  <ul className="divide-y border rounded-lg">
                    {districts.map(d => <li key={d.id} className="p-3 flex justify-between"><span>{d.name_bn} ({d.name_en})</span> <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">বিভাগ ID: {d.division_id}</span></li>)}
                  </ul>
                </div>
              )}

              {locTab === 'upazilas' && (
                <div>
                  <form onSubmit={handleAddUpazila} className="flex flex-col md:flex-row gap-4 mb-6 items-end bg-gray-50 p-4 rounded-lg border">
                    <div className="flex-1 w-full"><label className="text-sm font-bold">জেলা</label>
                    <select value={newUpa.district_id} onChange={e => setNewUpa({...newUpa, district_id: e.target.value})} className={inputClass} required>
                      <option value="">নির্বাচন করুন</option>
                      {districts.map(d => <option key={d.id} value={d.id}>{d.name_bn}</option>)}
                    </select></div>
                    <div className="flex-1 w-full"><label className="text-sm font-bold">উপজেলা (বাংলা)</label><input value={newUpa.name_bn} onChange={e => setNewUpa({...newUpa, name_bn: e.target.value})} className={inputClass} required/></div>
                    <div className="flex-1 w-full"><label className="text-sm font-bold">Upazila (English)</label><input value={newUpa.name_en} onChange={e => setNewUpa({...newUpa, name_en: e.target.value})} className={inputClass} required/></div>
                    <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">যোগ করুন</button>
                  </form>
                  <ul className="divide-y border rounded-lg">
                    {upazilas.map(u => <li key={u.id} className="p-3 flex justify-between"><span>{u.name_bn} ({u.name_en})</span> <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">জেলা ID: {u.district_id}</span></li>)}
                  </ul>
                </div>
              )}

              {locTab === 'unions' && (
                <div>
                  <form onSubmit={handleAddUnion} className="flex flex-col md:flex-row gap-4 mb-6 items-end bg-gray-50 p-4 rounded-lg border">
                    <div className="flex-1 w-full"><label className="text-sm font-bold">উপজেলা</label>
                    <select value={newUni.upazila_id} onChange={e => setNewUni({...newUni, upazila_id: e.target.value})} className={inputClass} required>
                      <option value="">নির্বাচন করুন</option>
                      {upazilas.map(u => <option key={u.id} value={u.id}>{u.name_bn}</option>)}
                    </select></div>
                    <div className="flex-1 w-full"><label className="text-sm font-bold">ইউনিয়ন/পৌরসভা (বাংলা)</label><input value={newUni.name_bn} onChange={e => setNewUni({...newUni, name_bn: e.target.value})} className={inputClass} required/></div>
                    <div className="flex-1 w-full"><label className="text-sm font-bold">Union (English)</label><input value={newUni.name_en} onChange={e => setNewUni({...newUni, name_en: e.target.value})} className={inputClass} required/></div>
                    <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">যোগ করুন</button>
                  </form>
                  <ul className="divide-y border rounded-lg">
                    {unions.map(u => <li key={u.id} className="p-3 flex justify-between"><span>{u.name_bn} ({u.name_en})</span> <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">উপজেলা ID: {u.upazila_id}</span></li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* View Modal */}
      {isViewOpen && selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-bold mb-4">আবেদনকারীর বিস্তারিত</h3>
            <p><strong>নাম:</strong> {selectedApp.first_name_bn} {selectedApp.last_name_bn}</p>
            <p><strong>ট্র্যাকিং:</strong> {selectedApp.tracking_id}</p>
            <p><strong>জেলা:</strong> {selectedApp.district}</p>
            <button onClick={() => setIsViewOpen(false)} className="mt-4 bg-gray-500 text-white px-4 py-2 rounded">বন্ধ করুন</button>
          </div>
        </div>
      )}

      {/* Hidden PDF Template */}
      {selectedApp && (
        <div style={{ position: 'absolute', top: '-10000px', left: '-10000px' }}>
           {/* এখানে আপনার আগের দেওয়া সার্টিফিকেট ডিজাইনটি থাকবে (আমি নিচে শুধু একটি ডামি দিলাম, আপনি আগের ডিজাইনটি এখানে পেস্ট করবেন) */}
          <div ref={printRef} style={{ width: '800px', padding: '50px', backgroundColor: '#fff' }}>
            <h1>জন্ম নিবন্ধন সনদ</h1>
            <p>নাম: {selectedApp.first_name_bn}</p>
            <img src={qrCodeUrl} width="100" />
            <img src={barcodeUrl} width="150" />
          </div>
        </div>
      )}
      <CustomAlert isOpen={alertState.isOpen} message={alertState.message} type={alertState.type} onClose={() => setAlertState({ ...alertState, isOpen: false })} />
    </div>
  );
}