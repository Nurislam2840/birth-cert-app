import { useState, useEffect, useRef } from 'react';
import { supabase, isAdmin, ASSETS_BUCKET_URL } from '../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import CustomAlert from '../components/CustomAlert';
import CustomSelect from '../components/CustomSelect'; 
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
  const [divisions, setDivisions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [upazilas, setUpazilas] = useState([]);
  const [unions, setUnions] = useState([]);

  // ট্রি ভিউ এক্সপ্যান্ড স্টেট
  const [expandedDivs, setExpandedDivs] = useState(new Set());
  const [expandedDists, setExpandedDists] = useState(new Set());
  const [expandedUpas, setExpandedUpas] = useState(new Set());

  // অ্যাড ফর্ম স্টেট
  const [showAddDiv, setShowAddDiv] = useState(false);
  const [showAddDist, setShowAddDist] = useState(false);
  const [showAddUpa, setShowAddUpa] = useState(false);
  const [showAddUnion, setShowAddUnion] = useState(false);

  const [newDiv, setNewDiv] = useState({ name_bn: '', name_en: '' });
  const [newDist, setNewDist] = useState({ division_id: '', name_bn: '', name_en: '', code: '' }); 
  const [newUpa, setNewUpa] = useState({ district_id: '', name_bn: '', name_en: '', code: '' }); 
  const [newUni, setNewUni] = useState({ upazila_id: '', name_bn: '', name_en: '' });

  // এডিট স্টেট
  const [isEditLocOpen, setIsEditLocOpen] = useState(false);
  const [editLocType, setEditLocType] = useState('');
  const [editLocData, setEditLocData] = useState({ id: '', name_bn: '', name_en: '', code: '' });

  // সার্টিফিকেট সেটিংস স্টেট
  const [certSettings, setCertSettings] = useState({
    id: 1, govt_name: '', office_name: '', rule_text: '', qr_prefix: '', footer_text: '', custom_union_name: ''
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isAdmin(user.email)) { router.push('/admin/login'); return; }
      setUser(user);
      await fetchApplications();
      await fetchAllLocations();
      await fetchCertSettings();
      setLoading(false);
    };
    checkAdmin();
  }, []);

  const fetchCertSettings = async () => {
    const { data } = await supabase.from('certificate_settings').select('*').eq('id', 1).single();
    if (data) setCertSettings(data);
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setIsSavingSettings(true);
    const { error } = await supabase.from('certificate_settings').update({
      govt_name: certSettings.govt_name,
      office_name: certSettings.office_name,
      rule_text: certSettings.rule_text,
      qr_prefix: certSettings.qr_prefix,
      footer_text: certSettings.footer_text,
      custom_union_name: certSettings.custom_union_name
    }).eq('id', 1);

    setIsSavingSettings(false);
    if (error) return setDebugError('আপডেট ব্যর্থ: ' + error.message);
    setAlertState({ isOpen: true, message: 'সেটিংস সফলভাবে আপডেট হয়েছে!', type: 'success' });
  };

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

  // ট্রি এক্সপ্যান্ড টগল
  const toggleDiv = (id) => {
    const newSet = new Set(expandedDivs);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setExpandedDivs(newSet);
  };

  const toggleDist = (id) => {
    const newSet = new Set(expandedDists);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setExpandedDists(newSet);
  };

  const toggleUpa = (id) => {
    const newSet = new Set(expandedUpas);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setExpandedUpas(newSet);
  };

  // অ্যাড ফাংশনসমূহ
  const handleAddDivision = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('divisions').insert([newDiv]);
    if (error) return setDebugError(error.message);
    setAlertState({ isOpen: true, message: 'বিভাগ সেভ হয়েছে!', type: 'success' });
    setNewDiv({ name_bn: '', name_en: '' });
    setShowAddDiv(false);
    fetchAllLocations();
  };

  const handleAddDistrict = async (e) => {
    e.preventDefault();
    if (!newDist.division_id) return setDebugError('বিভাগ নির্বাচন করুন');
    const { error } = await supabase.from('districts').insert([{ ...newDist, division_id: parseInt(newDist.division_id) }]);
    if (error) return setDebugError(error.message);
    setAlertState({ isOpen: true, message: 'জেলা সেভ হয়েছে!', type: 'success' });
    setNewDist({ ...newDist, name_bn: '', name_en: '', code: '' });
    setShowAddDist(false);
    fetchAllLocations();
  };

  const handleAddUpazila = async (e) => {
    e.preventDefault();
    if (!newUpa.district_id) return setDebugError('জেলা নির্বাচন করুন');
    const { error } = await supabase.from('upazilas').insert([{ ...newUpa, district_id: parseInt(newUpa.district_id) }]);
    if (error) return setDebugError(error.message);
    setAlertState({ isOpen: true, message: 'উপজেলা সেভ হয়েছে!', type: 'success' });
    setNewUpa({ ...newUpa, name_bn: '', name_en: '', code: '' });
    setShowAddUpa(false);
    fetchAllLocations();
  };

  const handleAddUnion = async (e) => {
    e.preventDefault();
    if (!newUni.upazila_id) return setDebugError('উপজেলা নির্বাচন করুন');
    const { error } = await supabase.from('unions').insert([{ 
      upazila_id: parseInt(newUni.upazila_id), 
      name_bn: newUni.name_bn, 
      name_en: newUni.name_en 
    }]);
    if (error) return setDebugError(error.message);
    setAlertState({ isOpen: true, message: 'ইউনিয়ন/পৌরসভা সেভ হয়েছে!', type: 'success' });
    setNewUni({ ...newUni, name_bn: '', name_en: '' });
    setShowAddUnion(false);
    fetchAllLocations();
  };

  // এডিট ও ডিলিট
  const openEditLoc = (type, data) => {
    setEditLocType(type);
    setEditLocData(data);
    setIsEditLocOpen(true);
  };

  const handleUpdateLoc = async (e) => {
    e.preventDefault();
    const updateData = { name_bn: editLocData.name_bn, name_en: editLocData.name_en };
    if (editLocType === 'districts' || editLocType === 'upazilas') {
      updateData.code = editLocData.code;
    }

    const { error } = await supabase
      .from(editLocType)
      .update(updateData)
      .eq('id', editLocData.id);

    if (error) return setDebugError('আপডেট ব্যর্থ: ' + error.message);
    
    setAlertState({ isOpen: true, message: 'সফলভাবে আপডেট হয়েছে!', type: 'success' });
    setIsEditLocOpen(false);
    fetchAllLocations();
  };

  const handleDeleteLoc = async (type, id) => {
    if (!window.confirm('আপনি কি নিশ্চিত এই লোকেশনটি ডিলিট করতে চান? এর অধীনে থাকা সব ডেটাও ডিলিট হয়ে যাবে।')) return;
    
    const { error } = await supabase.from(type).delete().eq('id', id);
    if (error) return setDebugError('ডিলিট ব্যর্থ: ' + error.message);
    
    setAlertState({ isOpen: true, message: 'ডিলিট করা হয়েছে!', type: 'success' });
    fetchAllLocations();
  };

  const handleDeleteApplication = async (id) => {
    if (!window.confirm('আপনি কি নিশ্চিতভাবে এই আবেদনটি চিরতরে ডিলিট করতে চান?')) return;
    try {
      const { error } = await supabase.from('birth_applications').delete().eq('id', id);
      if (error) throw error;
      setApplications(prev => prev.filter(app => app.id !== id));
      setIsViewOpen(false);
      setAlertState({ isOpen: true, message: 'আবেদনটি সফলভাবে ডিলিট করা হয়েছে!', type: 'success' });
    } catch (err) {
      setDebugError('ডিলিট ব্যর্থ: ' + err.message);
    }
  };

  // PDF জেনারেশন
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

  const inputClass = "w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 focus:bg-white";

  if (loading) return <div className="text-center mt-20 text-lg font-bold">লোড হচ্ছে...</div>;

  return (
    <div className="min-h-screen bg-gray-100 font-sans relative overflow-x-hidden">
      
      {debugError && (
        <div className="fixed top-0 left-0 w-full bg-red-600 text-white p-4 z-[9999] shadow-xl flex justify-between items-start">
          <div className="flex flex-col">
            <span className="font-bold text-lg mb-1">⏳ প্রোগ্রেস / এরর:</span>
            <span className="text-sm break-all font-semibold">{debugError}</span>
          </div>
          <button onClick={() => setDebugError(null)} className="bg-red-800 hover:bg-red-900 text-white font-bold py-1 px-3 rounded ml-2 whitespace-nowrap">বন্ধ করুন</button>
        </div>
      )}

      <nav className="bg-gray-900 text-white shadow-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="Logo" className="w-9 h-9 bg-white rounded-full p-1 shadow-md" />
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold tracking-wide">Admin Dashboard</h1>
              <p className="text-xs text-gray-400">Birth Registration System</p>
            </div>
            <div className="sm:hidden">
              <h1 className="text-sm font-bold tracking-wide">Admin</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm">
            <span className="hidden md:inline text-gray-300 bg-gray-800 px-3 py-1.5 rounded-full">{user?.email}</span>
            <Link href="/" className="bg-blue-600 px-3 py-1.5 md:px-4 md:py-1.5 rounded-lg hover:bg-blue-700 transition shadow">Main Site</Link>
            <button onClick={async () => { await supabase.auth.signOut(); router.push('/admin/login'); }} className="bg-red-600 px-3 py-1.5 md:px-4 md:py-1.5 rounded-lg hover:bg-red-700 transition shadow">Logout</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-2 md:px-4 py-4 md:py-8">
        
        <div className="flex bg-white rounded-xl shadow-md overflow-x-auto mb-6 md:mb-8 border border-gray-200 hide-scrollbar">
          <button onClick={() => setActiveTab('applications')} className={`flex-none px-4 py-3 md:px-6 md:py-4 font-bold text-xs md:text-sm transition-all whitespace-nowrap ${activeTab === 'applications' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}>Applications</button>
          <button onClick={() => setActiveTab('locations')} className={`flex-none px-4 py-3 md:px-6 md:py-4 font-bold text-xs md:text-sm transition-all whitespace-nowrap ${activeTab === 'locations' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}>Location Manager</button>
          <button onClick={() => setActiveTab('settings')} className={`flex-none px-4 py-3 md:px-6 md:py-4 font-bold text-xs md:text-sm transition-all whitespace-nowrap ${activeTab === 'settings' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}>Certificate Settings</button>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg border border-gray-200">
          
          {activeTab === 'applications' && (
            <>
              <div className="mb-4 md:mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-lg md:text-xl font-bold text-gray-800">All Applications</h2>
                <input type="text" placeholder="Search by Tracking ID or Name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={inputClass + ' md:w-1/2 lg:w-1/3'} />
              </div>
              
              <div className="overflow-x-auto w-full pb-4">
                <table className="w-full text-xs md:text-sm text-left min-w-[700px] border">
                  <thead className="bg-gray-50 text-gray-700 uppercase text-[10px] md:text-xs">
                    <tr>
                      <th className="px-2 md:px-4 py-3 border-b">Tracking ID</th>
                      <th className="px-2 md:px-4 py-3 border-b">Applicant Name</th>
                      <th className="px-2 md:px-4 py-3 border-b">Date</th>
                      <th className="px-2 md:px-4 py-3 border-b">Status</th>
                      <th className="px-2 md:px-4 py-3 border-b text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.filter(app => (app.tracking_id || '').includes(searchQuery) || (app.first_name_bn || '').includes(searchQuery)).map(app => {
                      const busy = processingIds.has(app.id);
                      return (
                        <tr key={app.id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="px-2 md:px-4 py-2 md:py-3 font-mono font-bold text-blue-600">{app.tracking_id}</td>
                          <td className="px-2 md:px-4 py-2 md:py-3">
                            <p className="font-semibold text-gray-800">{app.first_name_bn} {app.last_name_bn}</p>
                            <p className="text-[10px] md:text-xs text-gray-500">{app.first_name_en} {app.last_name_en}</p>
                          </td>
                          <td className="px-2 md:px-4 py-2 md:py-3 text-gray-600">{new Date(app.created_at).toLocaleDateString('en-GB')}</td>
                          <td className="px-2 md:px-4 py-2 md:py-3">
                            <span className={`px-2 py-1 rounded-full text-[10px] md:text-xs font-bold ${app.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                              {app.status}
                            </span>
                          </td>
                          <td className="px-2 md:px-4 py-2 md:py-3 flex flex-wrap justify-center gap-1 md:gap-2">
                            <button onClick={() => { setSelectedApp(app); setIsViewOpen(true); }} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-[10px] md:text-xs font-bold hover:bg-gray-200 transition">View</button>
                            {app.status === 'Pending' ? (
                              <button onClick={() => handleApprove(app)} disabled={busy} className={`px-2 py-1 text-white rounded text-[10px] md:text-xs font-bold transition ${busy ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 shadow-sm'}`}>
                                {busy ? '...' : 'Approve'}
                              </button>
                            ) : (
                              app.pdf_url && (
                                <button onClick={() => handleDownload(app)} className="px-2 py-1 bg-green-600 text-white rounded text-[10px] md:text-xs font-bold hover:bg-green-700 shadow-sm transition">Download</button>
                              )
                            )}
                            <button onClick={() => handleDeleteApplication(app.id)} className="px-2 py-1 bg-red-100 text-red-700 rounded text-[10px] md:text-xs font-bold hover:bg-red-200 transition">Delete</button>
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
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50 p-4 rounded-xl border border-gray-200 gap-4">
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-800">Location Hierarchy</h3>
                  <p className="text-xs md:text-sm text-gray-500">এডিট, ডিলিট বা নতুন লোকেশন যোগ করতে ট্রি ভিউ ব্যবহার করুন।</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <button onClick={() => setShowAddDiv(!showAddDiv)} className="w-full md:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow hover:bg-blue-700 transition flex items-center justify-center gap-2">
                    <span>+</span> Add Division
                  </button>
                </div>
              </div>

              {/* অ্যাড বিভাগ ফর্ম */}
              {showAddDiv && (
                <form onSubmit={handleAddDivision} className="bg-blue-50 p-4 rounded-xl border border-blue-200 flex flex-col md:flex-row gap-4 items-end mb-4">
                  <div className="flex-1 w-full"><label className="text-sm font-bold text-gray-700">Division (Bangla)</label><input value={newDiv.name_bn} onChange={e => setNewDiv({...newDiv, name_bn: e.target.value})} className={inputClass} required/></div>
                  <div className="flex-1 w-full"><label className="text-sm font-bold text-gray-700">Division (English)</label><input value={newDiv.name_en} onChange={e => setNewDiv({...newDiv, name_en: e.target.value})} className={inputClass} required/></div>
                  <button type="submit" className="w-full md:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 shadow-md">Save</button>
                </form>
              )}

              {/* অ্যাড জেলা ফর্ম */}
              {showAddDist && (
                <form onSubmit={handleAddDistrict} className="bg-green-50 p-4 rounded-xl border border-green-200 flex flex-col md:flex-row gap-4 items-end mb-4">
                  <div className="flex-1 w-full">
                    <label className="text-sm font-bold text-gray-700">Division</label>
                    <CustomSelect name="division_id" options={divisions.map(d => ({ value: d.id.toString(), label: d.name_bn }))} value={newDist.division_id} onChange={(e) => setNewDist({...newDist, division_id: e.target.value})} placeholder="Select Division" />
                  </div>
                  <div className="flex-1 w-full"><label className="text-sm font-bold text-gray-700">District (Bangla)</label><input value={newDist.name_bn} onChange={e => setNewDist({...newDist, name_bn: e.target.value})} className={inputClass} required/></div>
                  <div className="flex-1 w-full"><label className="text-sm font-bold text-gray-700">District (English)</label><input value={newDist.name_en} onChange={e => setNewDist({...newDist, name_en: e.target.value})} className={inputClass} required/></div>
                  <div className="flex-1 w-full"><label className="text-sm font-bold text-gray-700">Code (2 Digits)</label><input value={newDist.code || ''} onChange={e => setNewDist({...newDist, code: e.target.value})} placeholder="e.g. 90" className={inputClass} /></div>
                  <button type="submit" className="w-full md:w-auto bg-green-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-green-700 shadow-md">Save</button>
                </form>
              )}

              {/* অ্যাড উপজেলা ফর্ম */}
              {showAddUpa && (
                <form onSubmit={handleAddUpazila} className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 flex flex-col md:flex-row gap-4 items-end mb-4">
                  <div className="flex-1 w-full">
                    <label className="text-sm font-bold text-gray-700">District</label>
                    <CustomSelect name="district_id" options={districts.map(d => ({ value: d.id.toString(), label: d.name_bn }))} value={newUpa.district_id} onChange={(e) => setNewUpa({...newUpa, district_id: e.target.value})} placeholder="Select District" />
                  </div>
                  <div className="flex-1 w-full"><label className="text-sm font-bold text-gray-700">Upazila (Bangla)</label><input value={newUpa.name_bn} onChange={e => setNewUpa({...newUpa, name_bn: e.target.value})} className={inputClass} required/></div>
                  <div className="flex-1 w-full"><label className="text-sm font-bold text-gray-700">Upazila (English)</label><input value={newUpa.name_en} onChange={e => setNewUpa({...newUpa, name_en: e.target.value})} className={inputClass} required/></div>
                  <div className="flex-1 w-full"><label className="text-sm font-bold text-gray-700">Code (2 Digits)</label><input value={newUpa.code || ''} onChange={e => setNewUpa({...newUpa, code: e.target.value})} placeholder="e.g. 89" className={inputClass} /></div>
                  <button type="submit" className="w-full md:w-auto bg-yellow-500 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-yellow-600 shadow-md">Save</button>
                </form>
              )}

              {/* অ্যাড ইউনিয়ন ফর্ম */}
              {showAddUnion && (
                <form onSubmit={handleAddUnion} className="bg-purple-50 p-4 rounded-xl border border-purple-200 flex flex-col md:flex-row gap-4 items-end mb-4">
                  <div className="flex-1 w-full">
                    <label className="text-sm font-bold text-gray-700">Upazila</label>
                    <CustomSelect name="upazila_id" options={upazilas.map(u => ({ value: u.id.toString(), label: u.name_bn }))} value={newUni.upazila_id} onChange={(e) => setNewUni({...newUni, upazila_id: e.target.value})} placeholder="Select Upazila" />
                  </div>
                  <div className="flex-1 w-full"><label className="text-sm font-bold text-gray-700">Union/Paurshava (Bangla)</label><input value={newUni.name_bn} onChange={e => setNewUni({...newUni, name_bn: e.target.value})} className={inputClass} required/></div>
                  <div className="flex-1 w-full"><label className="text-sm font-bold text-gray-700">Union/Paurshava (English)</label><input value={newUni.name_en} onChange={e => setNewUni({...newUni, name_en: e.target.value})} placeholder="e.g. Union Parishad" className={inputClass} required/></div>
                  <button type="submit" className="w-full md:w-auto bg-purple-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-purple-700 shadow-md">Save</button>
                </form>
              )}

              {/* ট্রি ভিউ রেন্ডারিং */}
              <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
                {divisions.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">কোনো ডেটা নেই। নতুন বিভাগ যোগ করুন।</div>
                ) : (
                  divisions.map(div => (
                    <div key={div.id} className="border-b last:border-b-0">
                      <div className="flex flex-col md:flex-row md:items-center justify-between p-3 md:p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer gap-2" onClick={() => toggleDiv(div.id)}>
                        <div className="flex items-center gap-2 md:gap-3">
                          <span className={`transform transition-transform ${expandedDivs.has(div.id) ? 'rotate-90' : ''}`}>
                            <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                          </span>
                          <span className="font-bold text-gray-800 text-sm md:text-lg">{div.name_bn}</span>
                          <span className="text-xs md:text-sm text-gray-500 hidden sm:inline">({div.name_en})</span>
                        </div>
                        <div className="flex gap-2 md:gap-3 ml-6 md:ml-0" onClick={e => e.stopPropagation()}>
                          <button onClick={() => { setShowAddDist(true); setNewDist({...newDist, division_id: div.id.toString()}); }} className="text-green-600 text-xs md:text-sm font-bold hover:underline">+ District</button>
                          <button onClick={() => openEditLoc('divisions', div)} className="text-blue-600 text-xs md:text-sm font-bold hover:underline">Edit</button>
                          <button onClick={() => handleDeleteLoc('divisions', div.id)} className="text-red-600 text-xs md:text-sm font-bold hover:underline">Delete</button>
                        </div>
                      </div>

                      {expandedDivs.has(div.id) && (
                        <div className="pl-4 md:pl-8 bg-white">
                          {districts.filter(d => d.division_id === div.id).length === 0 ? (
                            <div className="p-4 text-xs md:text-sm text-gray-400 italic">কোনো জেলা নেই।</div>
                          ) : (
                            districts.filter(d => d.division_id === div.id).map(dist => (
                              <div key={dist.id} className="border-t">
                                <div className="flex flex-col md:flex-row md:items-center justify-between p-3 hover:bg-gray-50 cursor-pointer gap-2" onClick={() => toggleDist(dist.id)}>
                                  <div className="flex items-center gap-2 md:gap-3">
                                    <span className={`transform transition-transform ${expandedDists.has(dist.id) ? 'rotate-90' : ''}`}>
                                      <svg className="w-3 h-3 md:w-4 md:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                    </span>
                                    <span className="font-semibold text-gray-700 text-sm md:text-base">{dist.name_bn}</span>
                                    <span className="text-[10px] md:text-xs text-gray-500 hidden sm:inline">({dist.name_en})</span>
                                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Code: {dist.code || 'N/A'}</span>
                                  </div>
                                  <div className="flex gap-2 md:gap-3 ml-5 md:ml-0" onClick={e => e.stopPropagation()}>
                                    <button onClick={() => { setShowAddUpa(true); setNewUpa({...newUpa, district_id: dist.id.toString()}); }} className="text-yellow-600 text-xs md:text-sm font-bold hover:underline">+ Upazila</button>
                                    <button onClick={() => openEditLoc('districts', dist)} className="text-blue-600 text-xs md:text-sm font-bold hover:underline">Edit</button>
                                    <button onClick={() => handleDeleteLoc('districts', dist.id)} className="text-red-600 text-xs md:text-sm font-bold hover:underline">Delete</button>
                                  </div>
                                </div>

                                {expandedDists.has(dist.id) && (
                                  <div className="pl-4 md:pl-8 bg-gray-50/50">
                                    {upazilas.filter(u => u.district_id === dist.id).length === 0 ? (
                                      <div className="p-4 text-xs md:text-sm text-gray-400 italic">কোনো উপজেলা নেই।</div>
                                    ) : (
                                      upazilas.filter(u => u.district_id === dist.id).map(upa => (
                                        <div key={upa.id} className="border-t">
                                          <div className="flex flex-col md:flex-row md:items-center justify-between p-3 hover:bg-gray-100 cursor-pointer gap-2" onClick={() => toggleUpa(upa.id)}>
                                            <div className="flex items-center gap-2 md:gap-3">
                                              <span className={`transform transition-transform ${expandedUpas.has(upa.id) ? 'rotate-90' : ''}`}>
                                                <svg className="w-3 h-3 md:w-4 md:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                              </span>
                                              <span className="font-medium text-gray-700 text-xs md:text-base">{upa.name_bn}</span>
                                              <span className="text-[10px] md:text-xs text-gray-500 hidden sm:inline">({upa.name_en})</span>
                                              <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">Code: {upa.code || 'N/A'}</span>
                                            </div>
                                            <div className="flex gap-2 md:gap-3 ml-5 md:ml-0" onClick={e => e.stopPropagation()}>
                                              <button onClick={() => { setShowAddUnion(true); setNewUni({...newUni, upazila_id: upa.id.toString()}); }} className="text-purple-600 text-xs md:text-sm font-bold hover:underline">+ Union</button>
                                              <button onClick={() => openEditLoc('upazilas', upa)} className="text-blue-600 text-xs md:text-sm font-bold hover:underline">Edit</button>
                                              <button onClick={() => handleDeleteLoc('upazilas', upa.id)} className="text-red-600 text-xs md:text-sm font-bold hover:underline">Delete</button>
                                            </div>
                                          </div>

                                          {expandedUpas.has(upa.id) && (
                                            <div className="pl-4 md:pl-8 bg-white">
                                              {unions.filter(un => un.upazila_id === upa.id).length === 0 ? (
                                                <div className="p-4 text-xs md:text-sm text-gray-400 italic">কোনো ইউনিয়ন/পৌরসভা নেই।</div>
                                              ) : (
                                                unions.filter(un => un.upazila_id === upa.id).map(union => (
                                                  <div key={union.id} className="flex flex-col md:flex-row md:items-center justify-between p-2.5 md:p-3 border-t hover:bg-gray-50 gap-2">
                                                    <div className="flex items-center gap-2 md:gap-3">
                                                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-gray-300"></div>
                                                      <span className="text-gray-700 text-xs md:text-base">{union.name_bn}</span>
                                                      <span className="text-[10px] md:text-xs text-gray-500 hidden sm:inline">({union.name_en})</span>
                                                    </div>
                                                    <div className="flex gap-2 md:gap-3 ml-4 md:ml-0">
                                                      <button onClick={() => openEditLoc('unions', union)} className="text-blue-600 text-xs md:text-sm font-bold hover:underline">Edit</button>
                                                      <button onClick={() => handleDeleteLoc('unions', union.id)} className="text-red-600 text-xs md:text-sm font-bold hover:underline">Delete</button>
                                                    </div>
                                                  </div>
                                                ))
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      ))
                                    )}
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <form onSubmit={handleUpdateSettings} className="space-y-6 bg-white p-2">
              <h3 className="text-lg md:text-xl font-bold text-gray-800 border-b pb-3">Certificate Customization</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="text-sm font-bold text-gray-700">Govt. Name (English)</label>
                  <input value={certSettings.govt_name || ''} onChange={(e) => setCertSettings({...certSettings, govt_name: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700">Office Name (English)</label>
                  <input value={certSettings.office_name || ''} onChange={(e) => setCertSettings({...certSettings, office_name: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700">Rule Text</label>
                  <input value={certSettings.rule_text || ''} onChange={(e) => setCertSettings({...certSettings, rule_text: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700">QR Code Prefix</label>
                  <input value={certSettings.qr_prefix || ''} onChange={(e) => setCertSettings({...certSettings, qr_prefix: e.target.value})} className={inputClass} />
                </div>
                
                <div className="md:col-span-2">
                  <label className="text-sm font-bold text-gray-700">Custom Union Name (Optional)</label>
                  <input 
                    value={certSettings.custom_union_name || ''} 
                    onChange={(e) => setCertSettings({...certSettings, custom_union_name: e.target.value})} 
                    placeholder="e.g. Sunamganj Paurashava (Leave blank for automatic)"
                    className={inputClass} 
                  />
                  <p className="text-xs text-gray-500 mt-1">If you write a name here, it will override the application data in the certificate.</p>
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-bold text-gray-700">Footer Text</label>
                  <textarea rows="3" value={certSettings.footer_text || ''} onChange={(e) => setCertSettings({...certSettings, footer_text: e.target.value})} className={inputClass} />
                </div>
              </div>
              
              <button type="submit" disabled={isSavingSettings} className="bg-blue-600 text-white px-6 md:px-8 py-2.5 md:py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg disabled:bg-gray-400 w-full md:w-auto">
                {isSavingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Location Edit Modal */}
      {isEditLocOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[90] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Edit Location</h3>
            <form onSubmit={handleUpdateLoc} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-700">Name (Bangla)</label>
                <input value={editLocData.name_bn || ''} onChange={(e) => setEditLocData({ ...editLocData, name_bn: e.target.value })} className={inputClass} required />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700">Name (English)</label>
                <input value={editLocData.name_en || ''} onChange={(e) => setEditLocData({ ...editLocData, name_en: e.target.value })} className={inputClass} required />
              </div>
              {(editLocType === 'districts' || editLocType === 'upazilas') && (
                <div>
                  <label className="text-sm font-bold text-gray-700">Code (2 Digits)</label>
                  <input value={editLocData.code || ''} onChange={(e) => setEditLocData({ ...editLocData, code: e.target.value })} className={inputClass} />
                </div>
              )}
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsEditLocOpen(false)} className="px-4 md:px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition">Cancel</button>
                <button type="submit" className="px-4 md:px-5 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition shadow-md">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {isViewOpen && selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2 md:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] md:max-h-[90vh] overflow-hidden flex flex-col">
            
            <div className="flex justify-between items-center p-4 md:p-5 border-b bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-base md:text-lg">
                  {selectedApp.first_name_en?.charAt(0) || 'A'}
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-bold text-gray-800">Application Details</h3>
                  <p className="text-[10px] md:text-xs text-gray-500 font-mono">ID: {selectedApp.tracking_id}</p>
                </div>
              </div>
              <button onClick={() => setIsViewOpen(false)} className="text-gray-400 hover:text-red-600 transition">
                <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="p-4 md:p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                
                <div className="bg-gray-50 rounded-xl p-4 md:p-5 border border-gray-100">
                  <h4 className="text-xs md:text-sm font-bold text-blue-700 border-b pb-2 mb-3 uppercase tracking-wide">Applicant Information</h4>
                  <div className="space-y-2 text-xs md:text-sm">
                    <p className="flex justify-between"><span className="text-gray-500">Name (Bangla):</span> <span className="font-semibold text-gray-800 text-right">{selectedApp.first_name_bn} {selectedApp.last_name_bn}</span></p>
                    <p className="flex justify-between"><span className="text-gray-500">Name (English):</span> <span className="font-semibold text-gray-800 text-right">{selectedApp.first_name_en} {selectedApp.last_name_en}</span></p>
                    <p className="flex justify-between"><span className="text-gray-500">Date of Birth:</span> <span className="font-semibold text-gray-800">{selectedApp.dob}</span></p>
                    <p className="flex justify-between"><span className="text-gray-500">Gender:</span> <span className="font-semibold text-gray-800">{selectedApp.gender}</span></p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 md:p-5 border border-gray-100">
                  <h4 className="text-xs md:text-sm font-bold text-blue-700 border-b pb-2 mb-3 uppercase tracking-wide">Parent's Information</h4>
                  <div className="space-y-2 text-xs md:text-sm">
                    <p className="flex justify-between"><span className="text-gray-500">Father:</span> <span className="font-semibold text-gray-800 text-right">{selectedApp.father_name_bn}</span></p>
                    <p className="flex justify-between"><span className="text-gray-500">Mother:</span> <span className="font-semibold text-gray-800 text-right">{selectedApp.mother_name_bn}</span></p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 md:p-5 border border-gray-100 md:col-span-2">
                  <h4 className="text-xs md:text-sm font-bold text-blue-700 border-b pb-2 mb-3 uppercase tracking-wide">Address Details</h4>
                  <div className="text-xs md:text-sm">
                    <p className="text-gray-500 mb-1">Present Address:</p>
                    <p className="font-medium text-gray-800 bg-white p-2 rounded border">{selectedApp.house_road_bn}, {selectedApp.village_bn}, {selectedApp.post_office_bn}, {selectedApp.union_name}, {selectedApp.city_corp}, {selectedApp.district}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 md:p-5 border-t bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-3">
              <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
                <span className="text-xs md:text-sm font-semibold text-gray-600">Status:</span>
                <span className={`px-3 py-1 rounded-full text-[10px] md:text-xs font-bold ${selectedApp.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                  {selectedApp.status}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
                <button onClick={() => handleDeleteApplication(selectedApp.id)} className="px-3 md:px-5 py-2 md:py-2.5 bg-red-100 text-red-700 rounded-lg font-bold text-xs md:text-base hover:bg-red-200 transition shadow-sm">Delete</button>
                {selectedApp.pdf_url && (
                  <button onClick={() => handleDownload(selectedApp)} className="px-3 md:px-5 py-2 md:py-2.5 bg-green-600 text-white rounded-lg font-bold text-xs md:text-base hover:bg-green-700 transition shadow-md">Download</button>
                )}
                <button onClick={() => setIsViewOpen(false)} className="px-3 md:px-5 py-2 md:py-2.5 bg-gray-800 text-white rounded-lg font-bold text-xs md:text-base hover:bg-gray-900 transition shadow-md">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden PDF Template */}
      {selectedApp && (
        <div style={{ position: 'absolute', top: '-10000px', left: '-10000px' }}>
          <div ref={printRef} style={{ width: '800px', minHeight: '1130px', padding: '50px 60px', backgroundColor: '#ffffff', color: '#000000', fontFamily: 'Arial, sans-serif', position: 'relative', boxSizing: 'border-box' }}>
            
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -45%)', opacity: 0.12, zIndex: 0, pointerEvents: 'none', textAlign: 'center' }}>
              <img src={WATERMARK_URL} alt="Watermark" style={{ width: '850px' }} crossOrigin="anonymous" />
            </div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                
                <div style={{ width: '120px', textAlign: 'center', marginTop: '10px' }}>
                  {qrCodeUrl && <img id="qr-img" src={qrCodeUrl} alt="QR" style={{ width: '110px', height: '110px', margin: '0 auto', display: 'block' }} />}
                  <p style={{ fontSize: '13px', marginTop: '8px', fontWeight: 'bold', letterSpacing: '1px', color: '#555' }}>{certSettings.qr_prefix}</p>
                </div>
                
                <div style={{ flex: 1, textAlign: 'center', padding: '0 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <img src={LOGO_URL} alt="Logo" style={{ width: '75px', margin: '0 auto 10px auto', display: 'block' }} crossOrigin="anonymous" />
                  <h1 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0 0 5px 0', color: '#333', whiteSpace: 'nowrap' }}>{certSettings.govt_name}</h1>
                  <p style={{ fontSize: '13px', margin: '0 0 10px 0', color: '#444' }}>{certSettings.office_name}</p>
                  
                  <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: '500', color: '#222', lineHeight: '1.4' }}>
                    <p style={{ margin: 0 }}>
                      {certSettings.custom_union_name 
                        ? certSettings.custom_union_name.split(',')[0].trim() 
                        : (selectedApp.union_en || selectedApp.union_name || '').split(',')[0].trim()}
                    </p>
                    <p style={{ margin: 0 }}>
                      {safe(selectedApp.upazila_en || selectedApp.city_corp)}, {safe(selectedApp.district_en || selectedApp.district)}
                    </p>
                  </div>
                  <p style={{ fontSize: '11px', margin: '5px 0 0 0', color: '#555' }}>{certSettings.rule_text}</p>
                </div>
                
                <div style={{ width: '150px', textAlign: 'right', marginTop: '15px' }}>
                  {barcodeUrl && <img id="barcode-img" src={barcodeUrl} alt="Barcode" style={{ width: '150px', height: '45px' }} />}
                </div>
              </div>

              <h2 style={{ fontSize: '21px', fontWeight: 'bold', textAlign: 'center', margin: '20px 0 25px 0', fontFamily: 'Noto Sans Bengali, Arial, sans-serif', color: '#111' }}>
                জন্ম নিবন্ধন সনদ / Birth Registration Certificate
              </h2>

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

              <div style={{ fontSize: '13px', lineHeight: '2', color: '#222' }}>
                <div style={{ display: 'flex', marginBottom: '8px' }}>
                  <div style={{ width: '20%' }}>Date of Birth</div>
                  <div style={{ width: '30%' }}>: {selectedApp.dob}</div>
                  <div style={{ width: '15%' }}>Sex</div>
                  <div style={{ width: '35%' }}>: {selectedApp.gender === 'পুরুষ' ? 'Male' : selectedApp.gender === 'মহিলা' ? 'Female' : 'Hijra'}</div>
                </div>
                <div style={{ display: 'flex', marginBottom: '25px' }}>
                  <div style={{ width: '20%' }}>In Word</div>
                  <div style={{ width: '80%' }}>: {dateToWords(selectedApp.dob)}</div>
                </div>

                <div style={{ display: 'flex', marginBottom: '12px' }}>
                  <div style={{ width: '20%', fontFamily: 'Noto Sans Bengali, sans-serif' }}>নাম</div>
                  <div style={{ width: '30%', fontFamily: 'Noto Sans Bengali, sans-serif' }}>: {selectedApp.first_name_bn} {selectedApp.last_name_bn}</div>
                  <div style={{ width: '15%' }}>Name</div>
                  <div style={{ width: '35%' }}>: {selectedApp.first_name_en} {selectedApp.last_name_en}</div>
                </div>
                <div style={{ display: 'flex', marginBottom: '12px' }}>
                  <div style={{ width: '20%', fontFamily: 'Noto Sans Bengali, sans-serif' }}>মাতা</div>
                  <div style={{ width: '30%', fontFamily: 'Noto Sans Bengali, sans-serif' }}>: {selectedApp.mother_name_bn}</div>
                  <div style={{ width: '15%' }}>Mother</div>
                  <div style={{ width: '35%' }}>: {selectedApp.mother_name_en}</div>
                </div>
                <div style={{ display: 'flex', marginBottom: '12px' }}>
                  <div style={{ width: '20%', fontFamily: 'Noto Sans Bengali, sans-serif' }}>মাতার জাতীয়তা</div>
                  <div style={{ width: '30%', fontFamily: 'Noto Sans Bengali, sans-serif' }}>: বাংলাদেশী</div>
                  <div style={{ width: '15%' }}>Nationality</div>
                  <div style={{ width: '35%' }}>: Bangladeshi</div>
                </div>
                <div style={{ display: 'flex', marginBottom: '12px' }}>
                  <div style={{ width: '20%', fontFamily: 'Noto Sans Bengali, sans-serif' }}>পিতা</div>
                  <div style={{ width: '30%', fontFamily: 'Noto Sans Bengali, sans-serif' }}>: {selectedApp.father_name_bn}</div>
                  <div style={{ width: '15%' }}>Father</div>
                  <div style={{ width: '35%' }}>: {selectedApp.father_name_en}</div>
                </div>
                <div style={{ display: 'flex', marginBottom: '12px' }}>
                  <div style={{ width: '20%', fontFamily: 'Noto Sans Bengali, sans-serif' }}>পিতার জাতীয়তা</div>
                  <div style={{ width: '30%', fontFamily: 'Noto Sans Bengali, sans-serif' }}>: বাংলাদেশী</div>
                  <div style={{ width: '15%' }}>Nationality</div>
                  <div style={{ width: '35%' }}>: Bangladeshi</div>
                </div>
                <div style={{ display: 'flex', marginBottom: '12px' }}>
                  <div style={{ width: '20%', fontFamily: 'Noto Sans Bengali, sans-serif' }}>জন্মস্থান</div>
                  <div style={{ width: '30%', fontFamily: 'Noto Sans Bengali, sans-serif' }}>: {(selectedApp.village_bn || '').split(',')[0].trim()}, {safe(selectedApp.district)}, বাংলাদেশ</div>
                  <div style={{ width: '15%' }}>Place of Birth</div>
                  <div style={{ width: '35%' }}>: {(selectedApp.village_en || '').split(',')[0].trim()}, {safe(selectedApp.district_en || selectedApp.district)}, Bangladesh</div>
                </div>
                <div style={{ display: 'flex', marginBottom: '12px' }}>
                  <div style={{ width: '20%', fontFamily: 'Noto Sans Bengali, sans-serif' }}>স্থায়ী ঠিকানা</div>
                  <div style={{ width: '30%', fontFamily: 'Noto Sans Bengali, sans-serif' }}>: {(selectedApp.house_road_bn || '').split(',')[0].trim()}, {(selectedApp.village_bn || '').split(',')[0].trim()}, {safe(selectedApp.post_office_bn)}, {safe(selectedApp.district)}।</div>
                  <div style={{ width: '15%' }}>Permanent<br/>Address</div>
                  <div style={{ width: '35%' }}>: {(selectedApp.house_road_en || '').split(',')[0].trim()}, {(selectedApp.village_en || '').split(',')[0].trim()}, {safe(selectedApp.post_office_en)}, {safe(selectedApp.district_en || selectedApp.district)}.</div>
                </div>
              </div>

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
              
              <div style={{ textAlign: 'center', fontSize: '10px', marginTop: '40px', color: '#555', letterSpacing: '0.5px' }}>
                {certSettings.footer_text}
              </div>

            </div>
          </div>
        </div>
      )}
      <CustomAlert isOpen={alertState.isOpen} message={alertState.message} type={alertState.type} onClose={() => setAlertState({ ...alertState, isOpen: false })} />
    </div>
  );
}