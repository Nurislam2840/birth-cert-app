import { useState, useEffect, useRef } from 'react';
import { supabase, isAdmin } from '../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import CustomAlert from '../components/CustomAlert';
import CustomSelect from '../components/CustomSelect'; 
import PDFTemplate from '../components/PDFTemplate'; 
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const LOGO_URL = 'https://i.postimg.cc/J4t2GLWN/government-of-bangladesh-organization-public-sector-government-fc1aa96622361e91a0a538e6bce4bef9.png';

const Icons = {
  Dashboard: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>,
  Location: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>,
  Settings: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>,
  Users: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>,
  Check: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>,
  Pending: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>,
  Download: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>,
  Trash: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>,
  Edit: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>,
  Plus: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>,
  ChevronRight: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>,
  ChevronUp: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path></svg>,
  ChevronDown: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>,
  Search: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>,
  Close: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>,
  Logout: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>,
  Import: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>,
  Form: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>,
};

export default function Admin() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('applications');

  const [alertState, setAlertState] = useState({ isOpen: false, message: '', type: 'success' });
  const [debugError, setDebugError] = useState(null);

  const [applications, setApplications] = useState([]);
  const [processingIds, setProcessingIds] = useState(new Set());
  const [selectedApp, setSelectedApp] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [barcodeUrl, setBarcodeUrl] = useState(null);
  
  const printRef = useRef(null);

  const [divisions, setDivisions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [upazilas, setUpazilas] = useState([]);
  const [unions, setUnions] = useState([]);
  const [specialAreas, setSpecialAreas] = useState([]);
  
  const [expandedDivs, setExpandedDivs] = useState(new Set());
  const [expandedDists, setExpandedDists] = useState(new Set());
  const [expandedUpas, setExpandedUpas] = useState(new Set());

  const [showAddDiv, setShowAddDiv] = useState(false);
  const [showAddDist, setShowAddDist] = useState(false);
  const [showAddUpa, setShowAddUpa] = useState(false);
  const [showAddUnion, setShowAddUnion] = useState(false);

  const [newDiv, setNewDiv] = useState({ name_bn: '', name_en: '' });
  const [newDist, setNewDist] = useState({ division_id: '', name_bn: '', name_en: '', code: '' }); 
  const [newUpa, setNewUpa] = useState({ district_id: '', name_bn: '', name_en: '', code: '', type: 'upazila' }); 
  const [newUni, setNewUni] = useState({ upazila_id: '', name_bn: '', name_en: '' });

  const [isEditLocOpen, setIsEditLocOpen] = useState(false);
  const [editLocType, setEditLocType] = useState('');
  const [editLocData, setEditLocData] = useState({ id: '', name_bn: '', name_en: '', code: '', type: 'upazila' });

  const [isWardModalOpen, setIsWardModalOpen] = useState(false);
  const [selectedUpazilaForWard, setSelectedUpazilaForWard] = useState(null);
  const [newWard, setNewWard] = useState({ name_bn: '', name_en: '' });

  const [certSettings, setCertSettings] = useState({ id: 1, govt_name: '', office_name: '', rule_text: '', qr_prefix: '', footer_text: '', custom_union_name: '' });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);

  const [formFields, setFormFields] = useState([]);
  const [isAddFieldOpen, setIsAddFieldOpen] = useState(false);
  const [editField, setEditField] = useState(null);
  const [newField, setNewField] = useState({ field_name: '', label_bn: '', placeholder_bn: '', field_type: 'text', is_required: true, step: 1, order_index: 1, options: null, section: 'main' });

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isAdmin(user.email)) { router.push('/admin/login'); return; }
      setUser(user);
      await fetchApplications();
      await fetchAllLocations();
      await fetchCertSettings();
      await fetchFormFields();
      setLoading(false);
    };
    checkAdmin();
  }, []);

  const fetchAllLocations = async () => {
    const [divRes, distRes, upaRes, uniRes, specRes] = await Promise.all([
      supabase.from('divisions').select('*').order('id'),
      supabase.from('districts').select('*').order('id'),
      supabase.from('upazilas').select('*').order('order_index'),
      supabase.from('unions').select('*').order('id'),
      supabase.from('special_areas').select('*').order('id')
    ]);
    setDivisions(divRes.data || []);
    setDistricts(distRes.data || []);
    setUpazilas(upaRes.data || []);
    setUnions(uniRes.data || []);
    setSpecialAreas(specRes.data || []);
  };

  const handleMoveUpazila = async (districtId, currentIndex, direction) => {
    const districtUpazilas = upazilas.filter(u => u.district_id === districtId);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= districtUpazilas.length) return;

    const currentUpa = districtUpazilas[currentIndex];
    const targetUpa = districtUpazilas[targetIndex];

    await supabase.from('upazilas').update({ order_index: targetIndex }).eq('id', currentUpa.id);
    await supabase.from('upazilas').update({ order_index: currentIndex }).eq('id', targetUpa.id);
    
    fetchAllLocations();
  };

  const handleAddWard = async (e) => {
    e.preventDefault();
    if (!selectedUpazilaForWard) return;
    
    const type = selectedUpazilaForWard.type === 'cantonment' ? 'cantonment' : 'city_corp';
    const sub_type = selectedUpazilaForWard.type === 'cantonment' ? 'zone' : 'ward_zone';
    
    const { error } = await supabase.from('special_areas').insert([{
      type: type,
      sub_type: sub_type,
      name_bn: newWard.name_bn,
      name_en: newWard.name_en
    }]);

    if (error) return setDebugError(error.message);
    setAlertState({ isOpen: true, message: 'ওয়ার্ড/অঞ্চল সেভ হয়েছে!', type: 'success' });
    setNewWard({ name_bn: '', name_en: '' });
    fetchAllLocations();
  };

  const handleDeleteWard = async (id) => {
    if (!window.confirm('ডিলিট করতে চান?')) return;
    const { error } = await supabase.from('special_areas').delete().eq('id', id);
    if (error) {
      setDebugError('ডিলিট ব্যর্থ: ' + error.message);
    } else {
      setAlertState({ isOpen: true, message: 'সফলভাবে ডিলিট হয়েছে!', type: 'success' });
      fetchAllLocations();
    }
  };

  const handleDeleteLoc = async (type, id) => {
    if (!window.confirm('আপনি কি নিশ্চিত এই লোকেশনটি ডিলিট করতে চান?')) return;
    const { error } = await supabase.from(type).delete().eq('id', id);
    if (error) {
      setDebugError('ডিলিট ব্যর্থ: ' + error.message);
    } else {
      setAlertState({ isOpen: true, message: 'সফলভাবে ডিলিট করা হয়েছে!', type: 'success' });
      fetchAllLocations();
    }
  };

  const openEditLoc = (type, data) => { setEditLocType(type); setEditLocData(data); setIsEditLocOpen(true); };

  const handleUpdateLoc = async (e) => {
    e.preventDefault();
    const updateData = { name_bn: editLocData.name_bn, name_en: editLocData.name_en };
    if (editLocType === 'districts' || editLocType === 'upazilas') updateData.code = editLocData.code;
    if (editLocType === 'upazilas') updateData.type = editLocData.type;
    
    const { error } = await supabase.from(editLocType).update(updateData).eq('id', editLocData.id);
    if (error) return setDebugError('আপডেট ব্যর্থ: ' + error.message);
    setAlertState({ isOpen: true, message: 'সফলভাবে আপডেট হয়েছে!', type: 'success' });
    setIsEditLocOpen(false);
    fetchAllLocations();
  };

  const handleApprove = async (app) => {
    if (processingIds.has(app.id)) return;
    setProcessingIds(prev => new Set(prev).add(app.id));
    try {
      setDebugError('PDF তৈরি হচ্ছে...');
      setQrCodeUrl(null); setBarcodeUrl(null); setSelectedApp(app);
      await new Promise(r => setTimeout(r, 800));
      const qr = await QRCode.toDataURL(`https://verify.com/${app.tracking_id}`, { width: 256, margin: 1 });
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, app.tracking_id, { format: 'CODE128', displayValue: false, width: 2, height: 80, margin: 0 });
      setQrCodeUrl(qr); setBarcodeUrl(canvas.toDataURL('image/png'));
      await new Promise(r => setTimeout(r, 800));
      const canvasImg = await html2canvas(printRef.current, { scale: 2, useCORS: true, allowTaint: true });
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(canvasImg.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pdf.internal.pageSize.getWidth(), (canvasImg.height * pdf.internal.pageSize.getWidth()) / canvasImg.width);
      const pdfBlob = pdf.output('blob');
      const filePath = `certificates/${app.tracking_id}.pdf`;
      const { error: uploadError } = await supabase.storage.from('certificates').upload(filePath, pdfBlob, { contentType: 'application/pdf', upsert: true });
      if (uploadError) throw new Error('আপলোড ব্যর্থ: ' + uploadError.message);
      const { data: publicUrlData } = supabase.storage.from('certificates').getPublicUrl(filePath);
      const { error: updateError } = await supabase.from('birth_applications').update({ status: 'Approved', pdf_url: publicUrlData.publicUrl }).eq('id', app.id);
      if (updateError) throw new Error('ডাটাবেস ব্যর্থ: ' + updateError.message);
      setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: 'Approved', pdf_url: publicUrlData.publicUrl } : a));
      setDebugError(null);
      setAlertState({ isOpen: true, message: 'সার্টিফিকেট তৈরি হয়েছে!', type: 'success' });
    } catch (err) { setDebugError('এরর: ' + (err?.message || err.toString())); }
    finally { setProcessingIds(prev => { const next = new Set(prev); next.delete(app.id); return next; }); }
  };

  const handleDownload = async (app) => {
    if (!app.pdf_url) return;
    try {
      const res = await fetch(app.pdf_url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `Certificate-${app.tracking_id}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch (e) { window.open(app.pdf_url, '_blank'); }
  };

  const fetchFormFields = async () => {
    const { data } = await supabase.from('form_fields').select('*').order('step').order('order_index');
    setFormFields(data || []);
  };

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase.from('birth_applications').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setApplications(data || []);
    } catch (err) { setDebugError('ডেটা লোডে সমস্যা: ' + err.message); }
  };

  const fetchCertSettings = async () => {
    const { data } = await supabase.from('certificate_settings').select('*').eq('id', 1).single();
    if (data) setCertSettings(data);
  };

  const inputClass = "w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none bg-gray-50 focus:bg-white transition-all shadow-sm";

  if (loading) return <div className="text-center mt-20 text-lg font-bold text-teal-700">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans relative overflow-x-hidden">
      
      <aside className="w-full md:w-64 bg-gray-900 text-white md:min-h-screen flex flex-col shadow-2xl z-50 sticky top-0 md:relative">
        <div className="p-5 flex items-center gap-3 border-b border-gray-800 bg-gray-950">
          <img src={LOGO_URL} alt="Logo" className="w-10 h-10 bg-white rounded-full p-1 shadow-lg" />
          <div>
            <h1 className="text-sm font-bold tracking-wide text-teal-400">Admin Panel</h1>
            <p className="text-[10px] text-gray-400">Birth Registration</p>
          </div>
        </div>
        <nav className="flex-1 flex md:flex-col overflow-x-auto md:overflow-visible p-3 md:p-4 gap-2 hide-scrollbar">
          <button onClick={() => setActiveTab('applications')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${activeTab === 'applications' ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
            <Icons.Dashboard /> <span className="hidden md:inline">Applications</span>
          </button>
          <button onClick={() => setActiveTab('locations')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${activeTab === 'locations' ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
            <Icons.Location /> <span className="hidden md:inline">Location Manager</span>
          </button>
        </nav>
        <div className="p-4 border-t border-gray-800 hidden md:block bg-gray-950">
          <div className="text-xs text-gray-400 mb-3 truncate px-2">{user?.email}</div>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/admin/login'); }} className="w-full bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2"><Icons.Logout /> Logout</button>
        </div>
      </aside>

      <main className="flex-1 p-3 md:p-8 overflow-y-auto w-full max-w-full">
        {debugError && (
          <div className="mb-4 md:mb-6 bg-red-50 border-l-4 border-red-500 p-3 md:p-4 rounded-xl flex justify-between items-start shadow-sm text-xs md:text-sm">
            <div className="flex gap-2 md:gap-3">
              <div className="text-red-500"><Icons.Trash /></div>
              <div>
                <p className="font-bold text-red-800">Error</p>
                <p className="text-red-600">{debugError}</p>
              </div>
            </div>
            <button onClick={() => setDebugError(null)} className="text-gray-400 hover:text-red-600"><Icons.Close /></button>
          </div>
        )}

        {activeTab === 'applications' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8">
              <div className="bg-gradient-to-br from-teal-500 to-teal-700 p-4 md:p-6 rounded-2xl shadow-lg text-white flex items-center justify-between transform hover:scale-[1.02] transition-transform">
                <div>
                  <p className="text-teal-100 text-xs md:text-sm font-semibold mb-1">Total Applications</p>
                  <h3 className="text-2xl md:text-3xl font-extrabold">{applications.length}</h3>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"><Icons.Users /></div>
              </div>
              <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 p-4 md:p-6 rounded-2xl shadow-lg text-white flex items-center justify-between transform hover:scale-[1.02] transition-transform">
                <div>
                  <p className="text-yellow-100 text-xs md:text-sm font-semibold mb-1">Pending</p>
                  <h3 className="text-2xl md:text-3xl font-extrabold">{applications.filter(a => a.status === 'Pending').length}</h3>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"><Icons.Pending /></div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-700 p-4 md:p-6 rounded-2xl shadow-lg text-white flex items-center justify-between transform hover:scale-[1.02] transition-transform">
                <div>
                  <p className="text-green-100 text-xs md:text-sm font-semibold mb-1">Approved</p>
                  <h3 className="text-2xl md:text-3xl font-extrabold">{applications.filter(a => a.status === 'Approved').length}</h3>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"><Icons.Check /></div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden w-full max-w-full">
              <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-lg md:text-xl font-bold text-gray-800">Recent Applications</h2>
                <div className="relative w-full md:w-80">
                  <input type="text" placeholder="Search ID or Name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 md:py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none bg-gray-50 transition-all" />
                  <div className="absolute left-3 top-3 md:top-3.5 text-gray-400"><Icons.Search /></div>
                </div>
              </div>
              <div className="overflow-x-auto w-full hide-scrollbar">
                <table className="w-full text-sm text-left min-w-[600px] md:min-w-full">
                  <thead className="bg-gray-50 text-gray-600 uppercase text-[10px] md:text-[11px] tracking-wider font-semibold">
                    <tr>
                      <th className="px-2 md:px-6 py-3 md:py-4">Tracking ID</th>
                      <th className="px-2 md:px-6 py-3 md:py-4">Applicant</th>
                      <th className="px-2 md:px-6 py-3 md:py-4">Date</th>
                      <th className="px-2 md:px-6 py-3 md:py-4">Status</th>
                      <th className="px-2 md:px-6 py-3 md:py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {applications.filter(app => (app.tracking_id || '').includes(searchQuery) || (app.first_name_bn || '').includes(searchQuery)).map(app => {
                      const busy = processingIds.has(app.id);
                      return (
                        <tr key={app.id} className="hover:bg-teal-50/30 transition-colors">
                          <td className="px-2 md:px-6 py-3 md:py-4 font-mono font-bold text-teal-700 text-xs md:text-sm break-all">{app.tracking_id}</td>
                          <td className="px-2 md:px-6 py-3 md:py-4 min-w-[100px]">
                            <p className="font-bold text-gray-800 text-xs md:text-sm">{app.first_name_bn} {app.last_name_bn}</p>
                            <p className="text-[9px] md:text-xs text-gray-500">{app.first_name_en} {app.last_name_en}</p>
                          </td>
                          <td className="px-2 md:px-6 py-3 md:py-4 text-gray-600 text-xs md:text-sm whitespace-nowrap">{new Date(app.created_at).toLocaleDateString('en-GB')}</td>
                          <td className="px-2 md:px-6 py-3 md:py-4">
                            <span className={`inline-flex items-center gap-1 px-1.5 md:px-3 py-0.5 md:py-1.5 rounded-md text-[9px] md:text-xs font-bold whitespace-nowrap ${app.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                              {app.status === 'Pending' ? 'Pending' : 'Approved'}
                            </span>
                          </td>
                          <td className="px-2 md:px-6 py-3 md:py-4">
                            <div className="flex justify-center gap-1 md:gap-3">
                              <button onClick={() => { setSelectedApp(app); setIsViewOpen(true); }} className="p-1 md:p-2 text-gray-500 hover:bg-gray-200 rounded-lg transition" title="View"><Icons.Search /></button>
                              {app.status === 'Pending' ? (
                                <button onClick={() => handleApprove(app)} disabled={busy} className={`px-1.5 md:px-4 py-1 md:py-2 rounded-lg text-[9px] md:text-xs font-bold transition flex items-center gap-1 ${busy ? 'bg-gray-200 text-gray-400' : 'bg-teal-600 text-white hover:bg-teal-700'}`}>
                                  {busy ? 'Wait' : 'Approve'}
                                </button>
                              ) : (
                                app.pdf_url && <button onClick={() => handleDownload(app)} className="px-1.5 md:px-4 py-1 md:py-2 bg-green-600 text-white rounded-lg text-[9px] md:text-xs font-bold hover:bg-green-700 flex items-center gap-1"><Icons.Download /> DL</button>
                              )}
                              <button onClick={() => handleDeleteApplication(app.id)} className="p-1 md:p-2 text-red-500 hover:bg-red-100 rounded-lg transition" title="Delete"><Icons.Trash /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'locations' && (
          <div className="space-y-6 w-full max-w-full">
            <div className="bg-white p-3 md:p-6 rounded-2xl shadow-sm border border-gray-100 w-full max-w-full">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-8 gap-4">
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-gray-800">Location Hierarchy</h2>
                  <p className="text-[10px] md:text-sm text-gray-500 mt-1">Manage divisions, districts, upazilas, and unions.</p>
                </div>
                <div className="flex flex-wrap gap-2 md:gap-3 w-full md:w-auto">
                  <button onClick={() => setIsImportOpen(true)} className="flex-1 md:flex-none justify-center bg-teal-600 text-white px-3 md:px-5 py-2 md:py-2.5 rounded-xl font-bold text-[10px] md:text-sm shadow-lg shadow-teal-600/30 hover:bg-teal-700 transition flex items-center gap-1 md:gap-2">
                    <Icons.Import /> CSV
                  </button>
                  <button onClick={() => setShowAddDiv(!showAddDiv)} className="flex-1 md:flex-none justify-center bg-blue-600 text-white px-3 md:px-5 py-2 md:py-2.5 rounded-xl font-bold text-[10px] md:text-sm shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition flex items-center gap-1 md:gap-2">
                    <Icons.Plus /> Add Div
                  </button>
                </div>
              </div>

              <div className="border border-gray-200 rounded-2xl bg-white shadow-sm overflow-hidden w-full max-w-full">
                {divisions.length === 0 ? (
                  <div className="p-10 text-center text-gray-500">No data found. Add a division to start.</div>
                ) : (
                  divisions.map(div => (
                    <div key={div.id} className="border-b last:border-b-0">
                      <div className="flex flex-col md:flex-row md:items-center justify-between p-3 md:p-4 bg-gray-50 hover:bg-teal-50/50 cursor-pointer gap-2 transition-colors" onClick={() => toggleDiv(div.id)}>
                        <div className="flex items-center gap-2 md:gap-3">
                          <span className={`transform transition-transform text-teal-600 bg-teal-100 p-1 rounded-full ${expandedDivs.has(div.id) ? 'rotate-90' : ''}`}><Icons.ChevronRight /></span>
                          <span className="font-bold text-gray-800 text-sm md:text-lg">{div.name_bn}</span>
                          <span className="text-[10px] md:text-sm text-gray-500 hidden sm:inline">({div.name_en})</span>
                        </div>
                        <div className="flex gap-2 md:gap-3 ml-8 md:ml-0" onClick={e => e.stopPropagation()}>
                          <button onClick={() => { setShowAddDist(true); setNewDist({...newDist, division_id: div.id.toString()}); }} className="text-teal-600 text-[9px] md:text-xs font-bold hover:underline flex items-center gap-1"><Icons.Plus /> District</button>
                          <button onClick={() => openEditLoc('divisions', div)} className="text-blue-600 text-[9px] md:text-xs font-bold hover:underline"><Icons.Edit /></button>
                          <button onClick={() => handleDeleteLoc('divisions', div.id)} className="text-red-600 text-[9px] md:text-xs font-bold hover:underline"><Icons.Trash /></button>
                        </div>
                      </div>

                      {expandedDivs.has(div.id) && (
                        <div className="pl-4 md:pl-10 bg-white">
                          {districts.filter(d => d.division_id === div.id).map(dist => (
                            <div key={dist.id} className="border-t">
                              <div className="flex flex-col md:flex-row md:items-center justify-between p-2 md:p-3 hover:bg-gray-50 cursor-pointer gap-2" onClick={() => toggleDist(dist.id)}>
                                <div className="flex items-center gap-2 md:gap-3">
                                  <span className={`transform transition-transform text-gray-400 ${expandedDists.has(dist.id) ? 'rotate-90' : ''}`}><Icons.ChevronRight /></span>
                                  <span className="font-semibold text-gray-700 text-xs md:text-sm">{dist.name_bn}</span>
                                  <span className="text-[9px] md:text-[10px] bg-blue-100 text-blue-700 px-1.5 md:px-2 py-0.5 rounded-md font-bold">Code: {dist.code || 'N/A'}</span>
                                </div>
                                <div className="flex gap-2 md:gap-3 ml-8 md:ml-0" onClick={e => e.stopPropagation()}>
                                  <button onClick={() => { setShowAddUpa(true); setNewUpa({...newUpa, district_id: dist.id.toString()}); }} className="text-blue-600 text-[9px] md:text-xs font-bold hover:underline flex items-center gap-1"><Icons.Plus /> Upazila</button>
                                  <button onClick={() => openEditLoc('districts', dist)} className="text-blue-600 text-[9px] md:text-xs font-bold hover:underline"><Icons.Edit /></button>
                                  <button onClick={() => handleDeleteLoc('districts', dist.id)} className="text-red-600 text-[9px] md:text-xs font-bold hover:underline"><Icons.Trash /></button>
                                </div>
                              </div>

                              {expandedDists.has(dist.id) && (
                                <div className="pl-4 md:pl-10 bg-gray-50/30">
                                  {upazilas.filter(u => u.district_id === dist.id).map((upa, idx, arr) => (
                                    <div key={upa.id} className="border-t">
                                      <div className="flex flex-col md:flex-row md:items-center justify-between p-2 md:p-3 hover:bg-gray-100 cursor-pointer gap-2" onClick={() => toggleUpa(upa.id)}>
                                        <div className="flex items-center gap-1.5 md:gap-3 flex-wrap">
                                          <span className={`transform transition-transform text-gray-400 ${expandedUpas.has(upa.id) ? 'rotate-90' : ''}`}><Icons.ChevronRight /></span>
                                          <span className="font-medium text-gray-700 text-xs md:text-sm">{upa.name_bn}</span>
                                          
                                          <div className="flex gap-1 ml-1 md:ml-2">
                                            <button onClick={(e) => { e.stopPropagation(); handleMoveUpazila(dist.id, idx, 'up'); }} disabled={idx === 0} className="p-0.5 md:p-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"><Icons.ChevronUp /></button>
                                            <button onClick={(e) => { e.stopPropagation(); handleMoveUpazila(dist.id, idx, 'down'); }} disabled={idx === arr.length - 1} className="p-0.5 md:p-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"><Icons.ChevronDown /></button>
                                          </div>
                                        </div>
                                        <div className="flex gap-2 md:gap-3 ml-8 md:ml-0" onClick={e => e.stopPropagation()}>
                                          <button onClick={() => openEditLoc('upazilas', upa)} className="text-blue-600 text-[9px] md:text-xs font-bold hover:underline"><Icons.Edit /></button>
                                          <button onClick={() => handleDeleteLoc('upazilas', upa.id)} className="text-red-600 text-[9px] md:text-xs font-bold hover:underline"><Icons.Trash /></button>
                                        </div>
                                      </div>

                                      {expandedUpas.has(upa.id) && (
                                        <div className="pl-4 md:pl-10 bg-white">
                                          {(upa.type === 'city_corp' || upa.type === 'cantonment') ? (
                                            <div className="p-2 md:p-3 border-t">
                                              <div className="flex justify-between items-center mb-2">
                                                <span className="text-[9px] md:text-xs font-bold text-teal-700">ওয়ার্ড/অঞ্চল:</span>
                                                <button onClick={() => { setSelectedUpazilaForWard(upa); setIsWardModalOpen(true); }} className="text-teal-600 text-[9px] md:text-xs font-bold hover:underline">+ Add</button>
                                              </div>
                                              <div className="flex flex-wrap gap-1.5 md:gap-2">
                                                {specialAreas.filter(sa => sa.type === (upa.type === 'cantonment' ? 'cantonment' : 'city_corp')).map(area => (
                                                  <span key={area.id} className="bg-teal-50 text-teal-700 px-1.5 md:px-3 py-0.5 md:py-1 rounded-md text-[9px] md:text-xs font-bold border border-teal-200 flex items-center gap-1">
                                                    {area.name_bn}
                                                    <button onClick={() => handleDeleteWard(area.id)} className="text-red-500 hover:text-red-700"><Icons.Trash /></button>
                                                  </span>
                                                ))}
                                              </div>
                                            </div>
                                          ) : (
                                            unions.filter(un => un.upazila_id === upa.id).map(union => (
                                              <div key={union.id} className="flex flex-col md:flex-row md:items-center justify-between p-2 md:p-3 border-t hover:bg-gray-50 gap-2">
                                                <div className="flex items-center gap-2 md:gap-3 ml-4 md:ml-6">
                                                  <div className="w-1.5 h-1.5 rounded-full bg-teal-400"></div>
                                                  <span className="text-gray-700 text-[10px] md:text-sm">{union.name_bn}</span>
                                                </div>
                                                <div className="flex gap-2 md:gap-3 ml-8 md:ml-0">
                                                  <button onClick={() => openEditLoc('unions', union)} className="text-blue-600 text-[9px] md:text-xs font-bold hover:underline"><Icons.Edit /></button>
                                                  <button onClick={() => handleDeleteLoc('unions', union.id)} className="text-red-600 text-[9px] md:text-xs font-bold hover:underline"><Icons.Trash /></button>
                                                </div>
                                              </div>
                                            ))
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add Ward Modal */}
        {isWardModalOpen && selectedUpazilaForWard && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[90] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="px-4 md:px-6 py-3 md:py-4 border-b bg-gray-50 flex justify-between items-center">
                <h3 className="text-base md:text-lg font-bold">Add New {selectedUpazilaForWard.type === 'cantonment' ? 'Zone' : 'Ward/Zone'}</h3>
                <button onClick={() => { setIsWardModalOpen(false); setSelectedUpazilaForWard(null); }} className="text-gray-400 hover:text-red-500 bg-white p-1 rounded-full shadow-sm"><Icons.Close /></button>
              </div>
              <form onSubmit={handleAddWard} className="p-4 md:p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-700">Name (Bangla)</label>
                  <input value={newWard.name_bn} onChange={e => setNewWard({...newWard, name_bn: e.target.value})} className={inputClass} required/>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700">Name (English)</label>
                  <input value={newWard.name_en} onChange={e => setNewWard({...newWard, name_en: e.target.value})} className={inputClass} required/>
                </div>
                <div className="flex justify-end pt-4">
                  <button type="submit" className="bg-teal-600 text-white px-6 py-2 rounded-xl font-bold">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {selectedApp && (
          <PDFTemplate 
            ref={printRef} 
            app={selectedApp} 
            certSettings={certSettings} 
            qrCodeUrl={qrCodeUrl} 
            barcodeUrl={barcodeUrl} 
          />
        )}

        <CustomAlert isOpen={alertState.isOpen} message={alertState.message} type={alertState.type} onClose={() => setAlertState({ ...alertState, isOpen: false })} />
      </main>
    </div>
  );
}