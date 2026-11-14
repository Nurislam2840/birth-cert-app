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
  Search: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>,
  Close: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>,
  Logout: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>,
  Import: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>,
  Form: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>,
};

const numberToWords = (num) => { return num.toString(); };
const dateToWords = (dateStr) => { return dateStr; };
const safe = (val) => (val === null || val === undefined ? '' : String(val));

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
  const [expandedDivs, setExpandedDivs] = useState(new Set());
  const [expandedDists, setExpandedDists] = useState(new Set());
  const [expandedUpas, setExpandedUpas] = useState(new Set());

  const [showAddDiv, setShowAddDiv] = useState(false);
  const [showAddDist, setShowAddDist] = useState(false);
  const [showAddUpa, setShowAddUpa] = useState(false);
  const [showAddUnion, setShowAddUnion] = useState(false);

  const [newDiv, setNewDiv] = useState({ name_bn: '', name_en: '' });
  const [newDist, setNewDist] = useState({ division_id: '', name_bn: '', name_en: '', code: '' }); 
  const [newUpa, setNewUpa] = useState({ district_id: '', name_bn: '', name_en: '', code: '' }); 
  const [newUni, setNewUni] = useState({ upazila_id: '', name_bn: '', name_en: '' });

  const [isEditLocOpen, setIsEditLocOpen] = useState(false);
  const [editLocType, setEditLocType] = useState('');
  const [editLocData, setEditLocData] = useState({ id: '', name_bn: '', name_en: '', code: '' });

  const [certSettings, setCertSettings] = useState({ id: 1, govt_name: '', office_name: '', rule_text: '', qr_prefix: '', footer_text: '', custom_union_name: '' });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);

  const [formFields, setFormFields] = useState([]);
  const [isAddFieldOpen, setIsAddFieldOpen] = useState(false);
  const [editField, setEditField] = useState(null);
  // নতুন ফিল্ডে section ডিফল্ট 'main'
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

  const fetchFormFields = async () => {
    const { data } = await supabase.from('form_fields').select('*').order('step').order('order_index');
    setFormFields(data || []);
  };

  const handleAddField = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('form_fields').insert([newField]);
    if (error) return setDebugError(error.message);
    setAlertState({ isOpen: true, message: 'ফিল্ড সেভ হয়েছে!', type: 'success' });
    setNewField({ field_name: '', label_bn: '', placeholder_bn: '', field_type: 'text', is_required: true, step: 1, order_index: 1, options: null, section: 'main' });
    setIsAddFieldOpen(false);
    fetchFormFields();
  };

  const handleUpdateField = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('form_fields').update(editField).eq('id', editField.id);
    if (error) return setDebugError(error.message);
    setAlertState({ isOpen: true, message: 'ফিল্ড আপডেট হয়েছে!', type: 'success' });
    setEditField(null);
    fetchFormFields();
  };

  const handleDeleteField = async (id) => {
    if (!window.confirm('আপনি কি নিশ্চিত এই ফিল্ডটি ডিলিট করতে চান?')) return;
    const { error } = await supabase.from('form_fields').delete().eq('id', id);
    if (error) return setDebugError(error.message);
    setAlertState({ isOpen: true, message: 'ফিল্ড ডিলিট হয়েছে!', type: 'success' });
    fetchFormFields();
  };

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

  const toggleDiv = (id) => { const s = new Set(expandedDivs); s.has(id) ? s.delete(id) : s.add(id); setExpandedDivs(s); };
  const toggleDist = (id) => { const s = new Set(expandedDists); s.has(id) ? s.delete(id) : s.add(id); setExpandedDists(s); };
  const toggleUpa = (id) => { const s = new Set(expandedUpas); s.has(id) ? s.delete(id) : s.add(id); setExpandedUpas(s); };

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
    const { error } = await supabase.from('unions').insert([{ upazila_id: parseInt(newUni.upazila_id), name_bn: newUni.name_bn, name_en: newUni.name_en }]);
    if (error) return setDebugError(error.message);
    setAlertState({ isOpen: true, message: 'ইউনিয়ন সেভ হয়েছে!', type: 'success' });
    setNewUni({ ...newUni, name_bn: '', name_en: '' });
    setShowAddUnion(false);
    fetchAllLocations();
  };

  const openEditLoc = (type, data) => { setEditLocType(type); setEditLocData(data); setIsEditLocOpen(true); };

  const handleUpdateLoc = async (e) => {
    e.preventDefault();
    const updateData = { name_bn: editLocData.name_bn, name_en: editLocData.name_en };
    if (editLocType === 'districts' || editLocType === 'upazilas') updateData.code = editLocData.code;
    const { error } = await supabase.from(editLocType).update(updateData).eq('id', editLocData.id);
    if (error) return setDebugError('আপডেট ব্যর্থ: ' + error.message);
    setAlertState({ isOpen: true, message: 'সফলভাবে আপডেট হয়েছে!', type: 'success' });
    setIsEditLocOpen(false);
    fetchAllLocations();
  };

  const handleDeleteLoc = async (type, id) => {
    if (!window.confirm('আপনি কি নিশ্চিত এই লোকেশনটি ডিলিট করতে চান?')) return;
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
    } catch (err) { setDebugError('ডিলিট ব্যর্থ: ' + err.message); }
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

  const handleCSVImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsImporting(true);
    setDebugError('CSV ফাইল প্রসেস হচ্ছে...');
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const rows = text.split('\n').map(row => row.trim()).filter(row => row);
        if (rows.length < 2) throw new Error('ফাইলটি খালি বা ভুল ফরম্যাটে আছে।');
        const dataRows = rows.slice(1);
        let importCount = 0;
        let errorCount = 0;
        for (const row of dataRows) {
          if (!row || row.trim() === '' || row === '""') continue; 
          const values = row.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          if (values.length < 9 || !values[0] || !values[2] || !values[5] || !values[8]) { errorCount++; continue; }
          const divBn = values[0]; const divEn = values[1]; const distBn = values[2]; const distEn = values[3]; const distCode = values[4];
          const upaBn = values[5]; const upaEn = values[6]; const upaCode = values[7]; const uniBn = values[8]; const uniEn = values[9] ? values[9] : uniBn;
          try {
            let divId;
            const { data: existingDiv } = await supabase.from('divisions').select('id').eq('name_bn', divBn).maybeSingle();
            if (existingDiv) divId = existingDiv.id;
            else {
              const { data: newDiv } = await supabase.from('divisions').insert({ name_bn: divBn, name_en: divEn }).select().single();
              if (newDiv) divId = newDiv.id;
            }
            if (!divId) { errorCount++; continue; }
            let distId;
            const { data: existingDist } = await supabase.from('districts').select('id').eq('name_bn', distBn).eq('division_id', divId).maybeSingle();
            if (existingDist) distId = existingDist.id;
            else {
              const { data: newDist } = await supabase.from('districts').insert({ division_id: divId, name_bn: distBn, name_en: distEn, code: distCode }).select().single();
              if (newDist) distId = newDist.id;
            }
            if (!distId) { errorCount++; continue; }
            let upaId;
            const { data: existingUpa } = await supabase.from('upazilas').select('id').eq('name_bn', upaBn).eq('district_id', distId).maybeSingle();
            if (existingUpa) upaId = existingUpa.id;
            else {
              const { data: newUpa } = await supabase.from('upazilas').insert({ district_id: distId, name_bn: upaBn, name_en: upaEn, code: upaCode }).select().single();
              if (newUpa) upaId = newUpa.id;
            }
            if (!upaId) { errorCount++; continue; }
            const { data: existingUni } = await supabase.from('unions').select('id').eq('name_bn', uniBn).eq('upazila_id', upaId).maybeSingle();
            if (!existingUni) { await supabase.from('unions').insert({ upazila_id: upaId, name_bn: uniBn, name_en: uniEn }); }
            importCount++;
          } catch (err) { errorCount++; }
        }
        await fetchAllLocations();
        setDebugError(null);
        setAlertState({ isOpen: true, message: `ইমপোর্ট সম্পন্ন!\nসফল: ${importCount} টি\nএরর: ${errorCount} টি`, type: 'success' });
        setIsImportOpen(false);
      } catch (err) {
        setDebugError('CSV প্রসেসিং এরর: ' + err.message);
      } finally {
        setIsImporting(false);
        if(fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file, 'UTF-8'); 
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
          <button onClick={() => setActiveTab('formBuilder')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${activeTab === 'formBuilder' ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
            <Icons.Form /> <span className="hidden md:inline">Form Builder</span>
          </button>
          <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${activeTab === 'settings' ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
            <Icons.Settings /> <span className="hidden md:inline">Certificate Settings</span>
          </button>
        </nav>
        <div className="p-4 border-t border-gray-800 hidden md:block bg-gray-950">
          <div className="text-xs text-gray-400 mb-3 truncate px-2">{user?.email}</div>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/admin/login'); }} className="w-full bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white px-4 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2"><Icons.Logout /> Logout</button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="flex justify-between items-center md:hidden mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="font-bold text-gray-800">Dashboard</div>
          <div className="flex gap-2">
            <Link href="/" className="bg-teal-50 text-teal-700 px-3 py-1.5 rounded-lg text-xs font-bold">Site</Link>
            <button onClick={async () => { await supabase.auth.signOut(); router.push('/admin/login'); }} className="bg-red-50 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold">Logout</button>
          </div>
        </div>

        {debugError && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex justify-between items-start shadow-sm">
            <div className="flex gap-3">
              <div className="text-red-500"><Icons.Trash /></div>
              <div>
                <p className="text-sm font-bold text-red-800">Error</p>
                <p className="text-xs text-red-600">{debugError}</p>
              </div>
            </div>
            <button onClick={() => setDebugError(null)} className="text-gray-400 hover:text-red-600"><Icons.Close /></button>
          </div>
        )}

        {activeTab === 'applications' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-teal-500 to-teal-700 p-6 rounded-2xl shadow-lg text-white flex items-center justify-between transform hover:scale-[1.02] transition-transform">
                <div>
                  <p className="text-teal-100 text-sm font-semibold mb-1">Total Applications</p>
                  <h3 className="text-3xl font-extrabold">{applications.length}</h3>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"><Icons.Users /></div>
              </div>
              <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 p-6 rounded-2xl shadow-lg text-white flex items-center justify-between transform hover:scale-[1.02] transition-transform">
                <div>
                  <p className="text-yellow-100 text-sm font-semibold mb-1">Pending</p>
                  <h3 className="text-3xl font-extrabold">{applications.filter(a => a.status === 'Pending').length}</h3>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"><Icons.Pending /></div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-700 p-6 rounded-2xl shadow-lg text-white flex items-center justify-between transform hover:scale-[1.02] transition-transform">
                <div>
                  <p className="text-green-100 text-sm font-semibold mb-1">Approved</p>
                  <h3 className="text-3xl font-extrabold">{applications.filter(a => a.status === 'Approved').length}</h3>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"><Icons.Check /></div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-xl font-bold text-gray-800">Recent Applications</h2>
                <div className="relative w-full md:w-80">
                  <input type="text" placeholder="Search ID or Name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none bg-gray-50 transition-all" />
                  <div className="absolute left-4 top-3.5 text-gray-400"><Icons.Search /></div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[700px]">
                  <thead className="bg-gray-50 text-gray-600 uppercase text-[11px] tracking-wider font-semibold">
                    <tr>
                      <th className="px-6 py-4">Tracking ID</th>
                      <th className="px-6 py-4">Applicant</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {applications.filter(app => (app.tracking_id || '').includes(searchQuery) || (app.first_name_bn || '').includes(searchQuery)).map(app => {
                      const busy = processingIds.has(app.id);
                      return (
                        <tr key={app.id} className="hover:bg-teal-50/30 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-teal-700">{app.tracking_id}</td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-gray-800">{app.first_name_bn} {app.last_name_bn}</p>
                            <p className="text-xs text-gray-500">{app.first_name_en} {app.last_name_en}</p>
                          </td>
                          <td className="px-6 py-4 text-gray-600">{new Date(app.created_at).toLocaleDateString('en-GB')}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${app.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                              {app.status === 'Pending' ? <Icons.Pending /> : <Icons.Check />}
                              {app.status === 'Pending' ? 'Pending' : 'Approved'}
                            </span>
                          </td>
                          <td className="px-6 py-4 flex justify-center gap-3">
                            <button onClick={() => { setSelectedApp(app); setIsViewOpen(true); }} className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg transition" title="View"><Icons.Search /></button>
                            {app.status === 'Pending' ? (
                              <button onClick={() => handleApprove(app)} disabled={busy} className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${busy ? 'bg-gray-200 text-gray-400' : 'bg-teal-600 text-white hover:bg-teal-700 shadow-md shadow-teal-600/20'}`}>
                                {busy ? 'Wait...' : <><Icons.Check /> Approve</>}
                              </button>
                            ) : (
                              app.pdf_url && <button onClick={() => handleDownload(app)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 shadow-md shadow-green-600/20 flex items-center gap-2"><Icons.Download /> Download</button>
                            )}
                            <button onClick={() => handleDeleteApplication(app.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition" title="Delete"><Icons.Trash /></button>
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
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Location Hierarchy</h2>
                  <p className="text-sm text-gray-500 mt-1">Manage divisions, districts, upazilas, and unions.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => setIsImportOpen(true)} className="bg-teal-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-teal-600/30 hover:bg-teal-700 transition flex items-center gap-2">
                    <Icons.Import /> CSV Import
                  </button>
                  <button onClick={() => setShowAddDiv(!showAddDiv)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition flex items-center gap-2">
                    <Icons.Plus /> Add Division
                  </button>
                </div>
              </div>

              {showAddDiv && (
                <form onSubmit={handleAddDivision} className="bg-teal-50 p-5 rounded-xl border border-teal-100 flex flex-col md:flex-row gap-4 items-end mb-6">
                  <div className="flex-1 w-full"><label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Division (Bangla)</label><input value={newDiv.name_bn} onChange={e => setNewDiv({...newDiv, name_bn: e.target.value})} className={inputClass} required/></div>
                  <div className="flex-1 w-full"><label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Division (English)</label><input value={newDiv.name_en} onChange={e => setNewDiv({...newDiv, name_en: e.target.value})} className={inputClass} required/></div>
                  <button type="submit" className="w-full md:w-auto bg-teal-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-teal-700 shadow-md transition">Save</button>
                </form>
              )}
              {showAddDist && (
                <form onSubmit={handleAddDistrict} className="bg-blue-50 p-5 rounded-xl border border-blue-100 flex flex-col md:flex-row gap-4 items-end mb-6">
                  <div className="flex-1 w-full"><label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Division</label><CustomSelect name="division_id" options={divisions.map(d => ({ value: d.id.toString(), label: d.name_bn }))} value={newDist.division_id} onChange={(e) => setNewDist({...newDist, division_id: e.target.value})} placeholder="Select Division" /></div>
                  <div className="flex-1 w-full"><label className="text-xs font-bold text-gray-700 uppercase mb-1 block">District (Bangla)</label><input value={newDist.name_bn} onChange={e => setNewDist({...newDist, name_bn: e.target.value})} className={inputClass} required/></div>
                  <div className="flex-1 w-full"><label className="text-xs font-bold text-gray-700 uppercase mb-1 block">District (English)</label><input value={newDist.name_en} onChange={e => setNewDist({...newDist, name_en: e.target.value})} className={inputClass} required/></div>
                  <div className="flex-1 w-full"><label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Code</label><input value={newDist.code || ''} onChange={e => setNewDist({...newDist, code: e.target.value})} placeholder="90" className={inputClass} /></div>
                  <button type="submit" className="w-full md:w-auto bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-md transition">Save</button>
                </form>
              )}
              {showAddUpa && (
                <form onSubmit={handleAddUpazila} className="bg-yellow-50 p-5 rounded-xl border border-yellow-100 flex flex-col md:flex-row gap-4 items-end mb-6">
                  <div className="flex-1 w-full"><label className="text-xs font-bold text-gray-700 uppercase mb-1 block">District</label><CustomSelect name="district_id" options={districts.map(d => ({ value: d.id.toString(), label: d.name_bn }))} value={newUpa.district_id} onChange={(e) => setNewUpa({...newUpa, district_id: e.target.value})} placeholder="Select District" /></div>
                  <div className="flex-1 w-full"><label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Upazila (Bangla)</label><input value={newUpa.name_bn} onChange={e => setNewUpa({...newUpa, name_bn: e.target.value})} className={inputClass} required/></div>
                  <div className="flex-1 w-full"><label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Upazila (English)</label><input value={newUpa.name_en} onChange={e => setNewUpa({...newUpa, name_en: e.target.value})} className={inputClass} required/></div>
                  <div className="flex-1 w-full"><label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Code</label><input value={newUpa.code || ''} onChange={e => setNewUpa({...newUpa, code: e.target.value})} placeholder="89" className={inputClass} /></div>
                  <button type="submit" className="w-full md:w-auto bg-yellow-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-yellow-600 shadow-md transition">Save</button>
                </form>
              )}
              {showAddUnion && (
                <form onSubmit={handleAddUnion} className="bg-purple-50 p-5 rounded-xl border border-purple-100 flex flex-col md:flex-row gap-4 items-end mb-6">
                  <div className="flex-1 w-full"><label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Upazila</label><CustomSelect name="upazila_id" options={upazilas.map(u => ({ value: u.id.toString(), label: u.name_bn }))} value={newUni.upazila_id} onChange={(e) => setNewUni({...newUni, upazila_id: e.target.value})} placeholder="Select Upazila" /></div>
                  <div className="flex-1 w-full"><label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Union (Bangla)</label><input value={newUni.name_bn} onChange={e => setNewUni({...newUni, name_bn: e.target.value})} className={inputClass} required/></div>
                  <div className="flex-1 w-full"><label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Union (English)</label><input value={newUni.name_en} onChange={e => setNewUni({...newUni, name_en: e.target.value})} placeholder="e.g. Union Parishad" className={inputClass} required/></div>
                  <button type="submit" className="w-full md:w-auto bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 shadow-md transition">Save</button>
                </form>
              )}

              <div className="border border-gray-200 rounded-2xl bg-white shadow-sm overflow-hidden">
                {divisions.length === 0 ? (
                  <div className="p-10 text-center text-gray-500">No data found. Add a division to start.</div>
                ) : (
                  divisions.map(div => (
                    <div key={div.id} className="border-b last:border-b-0">
                      <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 hover:bg-teal-50/50 cursor-pointer gap-2 transition-colors" onClick={() => toggleDiv(div.id)}>
                        <div className="flex items-center gap-3">
                          <span className={`transform transition-transform text-teal-600 bg-teal-100 p-1 rounded-full ${expandedDivs.has(div.id) ? 'rotate-90' : ''}`}><Icons.ChevronRight /></span>
                          <span className="font-bold text-gray-800 text-lg">{div.name_bn}</span>
                          <span className="text-sm text-gray-500 hidden sm:inline">({div.name_en})</span>
                        </div>
                        <div className="flex gap-3 ml-10 md:ml-0" onClick={e => e.stopPropagation()}>
                          <button onClick={() => { setShowAddDist(true); setNewDist({...newDist, division_id: div.id.toString()}); }} className="text-teal-600 text-xs font-bold hover:underline flex items-center gap-1"><Icons.Plus /> District</button>
                          <button onClick={() => openEditLoc('divisions', div)} className="text-blue-600 text-xs font-bold hover:underline"><Icons.Edit /></button>
                          <button onClick={() => handleDeleteLoc('divisions', div.id)} className="text-red-600 text-xs font-bold hover:underline"><Icons.Trash /></button>
                        </div>
                      </div>

                      {expandedDivs.has(div.id) && (
                        <div className="pl-6 md:pl-10 bg-white">
                          {districts.filter(d => d.division_id === div.id).map(dist => (
                            <div key={dist.id} className="border-t">
                              <div className="flex flex-col md:flex-row md:items-center justify-between p-3 hover:bg-gray-50 cursor-pointer gap-2" onClick={() => toggleDist(dist.id)}>
                                <div className="flex items-center gap-3">
                                  <span className={`transform transition-transform text-gray-400 ${expandedDists.has(dist.id) ? 'rotate-90' : ''}`}><Icons.ChevronRight /></span>
                                  <span className="font-semibold text-gray-700 text-sm">{dist.name_bn}</span>
                                  <span className="text-xs text-gray-500 hidden sm:inline">({dist.name_en})</span>
                                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-bold">Code: {dist.code || 'N/A'}</span>
                                </div>
                                <div className="flex gap-3 ml-8 md:ml-0" onClick={e => e.stopPropagation()}>
                                  <button onClick={() => { setShowAddUpa(true); setNewUpa({...newUpa, district_id: dist.id.toString()}); }} className="text-blue-600 text-xs font-bold hover:underline flex items-center gap-1"><Icons.Plus /> Upazila</button>
                                  <button onClick={() => openEditLoc('districts', dist)} className="text-blue-600 text-xs font-bold hover:underline"><Icons.Edit /></button>
                                  <button onClick={() => handleDeleteLoc('districts', dist.id)} className="text-red-600 text-xs font-bold hover:underline"><Icons.Trash /></button>
                                </div>
                              </div>

                              {expandedDists.has(dist.id) && (
                                <div className="pl-6 md:pl-10 bg-gray-50/30">
                                  {upazilas.filter(u => u.district_id === dist.id).map(upa => (
                                    <div key={upa.id} className="border-t">
                                      <div className="flex flex-col md:flex-row md:items-center justify-between p-3 hover:bg-gray-100 cursor-pointer gap-2" onClick={() => toggleUpa(upa.id)}>
                                        <div className="flex items-center gap-3">
                                          <span className={`transform transition-transform text-gray-400 ${expandedUpas.has(upa.id) ? 'rotate-90' : ''}`}><Icons.ChevronRight /></span>
                                          <span className="font-medium text-gray-700 text-sm">{upa.name_bn}</span>
                                          <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-md font-bold">Code: {upa.code || 'N/A'}</span>
                                        </div>
                                        <div className="flex gap-3 ml-8 md:ml-0" onClick={e => e.stopPropagation()}>
                                          <button onClick={() => { setShowAddUnion(true); setNewUni({...newUni, upazila_id: upa.id.toString()}); }} className="text-purple-600 text-xs font-bold hover:underline flex items-center gap-1"><Icons.Plus /> Union</button>
                                          <button onClick={() => openEditLoc('upazilas', upa)} className="text-blue-600 text-xs font-bold hover:underline"><Icons.Edit /></button>
                                          <button onClick={() => handleDeleteLoc('upazilas', upa.id)} className="text-red-600 text-xs font-bold hover:underline"><Icons.Trash /></button>
                                        </div>
                                      </div>

                                      {expandedUpas.has(upa.id) && (
                                        <div className="pl-6 md:pl-10 bg-white">
                                          {unions.filter(un => un.upazila_id === upa.id).map(union => (
                                            <div key={union.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 border-t hover:bg-gray-50 gap-2">
                                              <div className="flex items-center gap-3 ml-6">
                                                <div className="w-1.5 h-1.5 rounded-full bg-teal-400"></div>
                                                <span className="text-gray-700 text-sm">{union.name_bn}</span>
                                                <span className="text-[10px] text-gray-400 hidden sm:inline">({union.name_en})</span>
                                              </div>
                                              <div className="flex gap-3 ml-10 md:ml-0">
                                                <button onClick={() => openEditLoc('unions', union)} className="text-blue-600 text-xs font-bold hover:underline"><Icons.Edit /></button>
                                                <button onClick={() => handleDeleteLoc('unions', union.id)} className="text-red-600 text-xs font-bold hover:underline"><Icons.Trash /></button>
                                              </div>
                                            </div>
                                          ))}
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

        {activeTab === 'formBuilder' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Dynamic Form Builder</h2>
                <p className="text-sm text-gray-500 mt-1">Add, edit or delete form fields that appear on the Apply page.</p>
              </div>
              <button onClick={() => setIsAddFieldOpen(true)} className="bg-teal-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-teal-600/30 hover:bg-teal-700 transition flex items-center gap-2">
                <Icons.Plus /> Add New Field
              </button>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Field Name</th>
                    <th className="px-4 py-3">Label (Bangla)</th>
                    <th className="px-4 py-3">Section</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Step</th>
                    <th className="px-4 py-3">Required</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {formFields.map(field => (
                    <tr key={field.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-teal-600">{field.field_name}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{field.label_bn}</td>
                      <td className="px-4 py-3 text-gray-600">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs">{field.section || 'main'}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 capitalize">{field.field_type}</td>
                      <td className="px-4 py-3 text-gray-600">{field.step}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${field.is_required ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                          {field.is_required ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3 flex justify-center gap-2">
                        <button onClick={() => setEditField(field)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Icons.Edit /></button>
                        <button onClick={() => handleDeleteField(field.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Icons.Trash /></button>
                      </td>
                    </tr>
                  ))}
                  {formFields.length === 0 && (
                    <tr><td colSpan="7" className="text-center py-8 text-gray-500">No fields found. Add a new field to start.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-4"><Icons.Settings /> Certificate Settings</h2>
            <form onSubmit={handleUpdateSettings} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Govt. Name (English)</label>
                  <input value={certSettings.govt_name || ''} onChange={(e) => setCertSettings({...certSettings, govt_name: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Office Name (English)</label>
                  <input value={certSettings.office_name || ''} onChange={(e) => setCertSettings({...certSettings, office_name: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Rule Text</label>
                  <input value={certSettings.rule_text || ''} onChange={(e) => setCertSettings({...certSettings, rule_text: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">QR Code Prefix</label>
                  <input value={certSettings.qr_prefix || ''} onChange={(e) => setCertSettings({...certSettings, qr_prefix: e.target.value})} className={inputClass} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Custom Union Name (Optional)</label>
                  <input value={certSettings.custom_union_name || ''} onChange={(e) => setCertSettings({...certSettings, custom_union_name: e.target.value})} placeholder="e.g. Sunamganj Paurashava" className={inputClass} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Footer Text</label>
                  <textarea rows="3" value={certSettings.footer_text || ''} onChange={(e) => setCertSettings({...certSettings, footer_text: e.target.value})} className={inputClass} />
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t">
                <button type="submit" disabled={isSavingSettings} className="bg-teal-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-teal-700 transition shadow-lg shadow-teal-600/30 disabled:bg-gray-400 flex items-center gap-2">
                  {isSavingSettings ? 'Saving...' : <><Icons.Check /> Save Changes</>}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* CSV Import Modal */}
      {isImportOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[90] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Icons.Import /> Import CSV Data</h3>
              <button onClick={() => setIsImportOpen(false)} className="text-gray-400 hover:text-red-500 bg-white p-1 rounded-full shadow-sm"><Icons.Close /></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4 font-medium">আপনার CSV ফাইলে নিচের কলামগুলো থাকতে হবে (হেডার সহ):</p>
              <div className="bg-gray-100 p-3 rounded-lg text-xs font-mono mb-6 overflow-x-auto whitespace-nowrap border border-gray-200 text-teal-800">
                division_bn, division_en, district_bn, district_en, district_code, upazila_bn, upazila_en, upazila_code, union_bn, union_en
              </div>
              <input 
                type="file" 
                accept=".csv" 
                ref={fileInputRef} 
                onChange={handleCSVImport} 
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 transition-all border border-gray-300 rounded-xl cursor-pointer"
                disabled={isImporting}
              />
              {isImporting && <p className="text-sm text-teal-600 mt-4 animate-pulse font-bold flex items-center gap-2"><Icons.Pending /> ফাইল প্রসেস হচ্ছে, অপেক্ষা করুন...</p>}
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 text-right">
              <button onClick={() => setIsImportOpen(false)} className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition" disabled={isImporting}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Field Modal */}
      {isAddFieldOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[90] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-bold">Add New Field</h3>
              <button onClick={() => setIsAddFieldOpen(false)} className="text-gray-400 hover:text-red-500 bg-white p-1 rounded-full shadow-sm"><Icons.Close /></button>
            </div>
            <form onSubmit={handleAddField} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700">Field Name (ex: villageBn)</label>
                <input value={newField.field_name} onChange={e => setNewField({...newField, field_name: e.target.value})} className={inputClass} required/>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700">Label (Bangla)</label>
                <input value={newField.label_bn} onChange={e => setNewField({...newField, label_bn: e.target.value})} className={inputClass} required/>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700">Section</label>
                <select value={newField.section} onChange={e => setNewField({...newField, section: e.target.value})} className={inputClass}>
                  <option value="main">Main Details (Step 1 & 2)</option>
                  <option value="birth">Birth Address (Step 3)</option>
                  <option value="permanent">Permanent Address (Step 3)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700">Step</label>
                <input type="number" value={newField.step} onChange={e => setNewField({...newField, step: parseInt(e.target.value)})} className={inputClass} required/>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700">Field Type</label>
                <select value={newField.field_type} onChange={e => setNewField({...newField, field_type: e.target.value})} className={inputClass}>
                  <option value="text">Text</option>
                  <option value="date">Date</option>
                  <option value="number">Number</option>
                  <option value="select">Select</option>
                </select>
              </div>
              {newField.field_type === 'select' && (
                <div>
                  <label className="text-xs font-bold text-gray-700">Options (Comma separated)</label>
                  <input value={newField.options ? newField.options.join(',') : ''} onChange={e => setNewField({...newField, options: e.target.value.split(',')})} placeholder="পুরুষ, মহিলা" className={inputClass} />
                </div>
              )}
              <div className="flex justify-end pt-4">
                <button type="submit" className="bg-teal-600 text-white px-6 py-2 rounded-xl font-bold">Save Field</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Field Modal */}
      {editField && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[90] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-bold">Edit Field</h3>
              <button onClick={() => setEditField(null)} className="text-gray-400 hover:text-red-500 bg-white p-1 rounded-full shadow-sm"><Icons.Close /></button>
            </div>
            <form onSubmit={handleUpdateField} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700">Field Name</label>
                <input value={editField.field_name} onChange={e => setEditField({...editField, field_name: e.target.value})} className={inputClass} required/>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700">Label (Bangla)</label>
                <input value={editField.label_bn} onChange={e => setEditField({...editField, label_bn: e.target.value})} className={inputClass} required/>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700">Section</label>
                <select value={editField.section || 'main'} onChange={e => setEditField({...editField, section: e.target.value})} className={inputClass}>
                  <option value="main">Main Details (Step 1 & 2)</option>
                  <option value="birth">Birth Address (Step 3)</option>
                  <option value="permanent">Permanent Address (Step 3)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700">Step</label>
                <input type="number" value={editField.step} onChange={e => setEditField({...editField, step: parseInt(e.target.value)})} className={inputClass} required/>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700">Field Type</label>
                <select value={editField.field_type} onChange={e => setEditField({...editField, field_type: e.target.value})} className={inputClass}>
                  <option value="text">Text</option>
                  <option value="date">Date</option>
                  <option value="number">Number</option>
                  <option value="select">Select</option>
                </select>
              </div>
              {editField.field_type === 'select' && (
                <div>
                  <label className="text-xs font-bold text-gray-700">Options (Comma separated)</label>
                  <input value={editField.options ? editField.options.join(',') : ''} onChange={e => setEditField({...editField, options: e.target.value.split(',')})} className={inputClass} />
                </div>
              )}
              <div className="flex justify-end pt-4">
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold">Update Field</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Location Edit Modal */}
      {isEditLocOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[90] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Edit Location</h3>
              <button onClick={() => setIsEditLocOpen(false)} className="text-gray-400 hover:text-red-500 bg-white p-1 rounded-full shadow-sm"><Icons.Close /></button>
            </div>
            <form onSubmit={handleUpdateLoc} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase mb-2 block">Name (Bangla)</label>
                <input value={editLocData.name_bn || ''} onChange={(e) => setEditLocData({ ...editLocData, name_bn: e.target.value })} className={inputClass} required />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase mb-2 block">Name (English)</label>
                <input value={editLocData.name_en || ''} onChange={(e) => setEditLocData({ ...editLocData, name_en: e.target.value })} className={inputClass} required />
              </div>
              {(editLocType === 'districts' || editLocType === 'upazilas') && (
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase mb-2 block">Code (2 Digits)</label>
                  <input value={editLocData.code || ''} onChange={(e) => setEditLocData({ ...editLocData, code: e.target.value })} className={inputClass} />
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsEditLocOpen(false)} className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 shadow-md">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {isViewOpen && selectedApp && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-100">
            <div className="flex justify-between items-center px-8 py-5 border-b bg-gray-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-bold text-xl shadow-inner">{selectedApp.first_name_en?.charAt(0) || 'A'}</div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Application Details</h3>
                  <p className="text-sm text-teal-600 font-mono font-semibold">ID: {selectedApp.tracking_id}</p>
                </div>
              </div>
              <button onClick={() => setIsViewOpen(false)} className="text-gray-400 hover:text-red-600 bg-white p-2 rounded-full shadow-sm"><Icons.Close /></button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <h4 className="text-sm font-bold text-teal-700 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2"><Icons.Users /> Applicant Info</h4>
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500 font-medium">Name (BN):</span> <span className="font-bold text-gray-800">{selectedApp.first_name_bn} {selectedApp.last_name_bn}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 font-medium">Name (EN):</span> <span className="font-bold text-gray-800">{selectedApp.first_name_en} {selectedApp.last_name_en}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 font-medium">DOB:</span> <span className="font-bold text-gray-800">{selectedApp.dob}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 font-medium">Gender:</span> <span className="font-bold text-gray-800">{selectedApp.gender}</span></div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <h4 className="text-sm font-bold text-teal-700 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2"><Icons.Users /> Parent's Info</h4>
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500 font-medium">Father:</span> <span className="font-bold text-gray-800">{selectedApp.father_name_bn}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 font-medium">Father (EN):</span> <span className="font-bold text-gray-800">{selectedApp.father_name_en}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 font-medium">Mother:</span> <span className="font-bold text-gray-800">{selectedApp.mother_name_bn}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 font-medium">Mother (EN):</span> <span className="font-bold text-gray-800">{selectedApp.mother_name_en}</span></div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 md:col-span-2 shadow-sm">
                  <h4 className="text-sm font-bold text-teal-700 uppercase tracking-wider mb-4 border-b pb-2 flex items-center gap-2"><Icons.Location /> Address Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div>
                      <p className="text-gray-500 font-medium mb-2">Present:</p>
                      <p className="font-medium text-gray-800 bg-white p-4 rounded-xl border border-gray-200 shadow-sm leading-relaxed">{selectedApp.house_road_bn}, {selectedApp.village_bn}, {selectedApp.post_office_bn}, {selectedApp.union_name}, {selectedApp.city_corp}, {selectedApp.district}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium mb-2">Permanent:</p>
                      <p className="font-medium text-gray-800 bg-white p-4 rounded-xl border border-gray-200 shadow-sm leading-relaxed">{selectedApp.permanent_same ? 'Same as Present' : `${selectedApp.permanent_village_bn || ''}, ${selectedApp.permanent_district || ''}`}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-8 py-5 border-t bg-gray-50 flex justify-between items-center">
              <div className={`px-4 py-1.5 rounded-lg text-sm font-bold ${selectedApp.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{selectedApp.status}</div>
              <div className="flex gap-3">
                <button onClick={() => handleDeleteApplication(selectedApp.id)} className="px-5 py-2.5 bg-red-100 text-red-700 rounded-xl font-bold text-sm hover:bg-red-200 transition">Delete</button>
                {selectedApp.pdf_url && (
                  <button onClick={() => handleDownload(selectedApp)} className="px-5 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition shadow-lg shadow-green-600/30 flex items-center gap-2"><Icons.Download /> Download</button>
                )}
                <button onClick={() => setIsViewOpen(false)} className="px-5 py-2.5 bg-gray-800 text-white rounded-xl font-bold text-sm hover:bg-gray-900 transition">Close</button>
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
                    <p style={{ margin: 0 }}>{certSettings.custom_union_name ? certSettings.custom_union_name.split(',')[0].trim() : (selectedApp.union_en || selectedApp.union_name || '').split(',')[0].trim()}</p>
                    <p style={{ margin: 0 }}>{safe(selectedApp.upazila_en || selectedApp.city_corp)}, {safe(selectedApp.district_en || selectedApp.district)}</p>
                  </div>
                  <p style={{ fontSize: '11px', margin: '5px 0 0 0', color: '#555' }}>{certSettings.rule_text}</p>
                </div>
                <div style={{ width: '150px', textAlign: 'right', marginTop: '15px' }}>
                  {barcodeUrl && <img id="barcode-img" src={barcodeUrl} alt="Barcode" style={{ width: '150px', height: '45px' }} />}
                </div>
              </div>
              <h2 style={{ fontSize: '21px', fontWeight: 'bold', textAlign: 'center', margin: '20px 0 25px 0', fontFamily: 'Noto Sans Bengali, Arial, sans-serif', color: '#111' }}>জন্ম নিবন্ধন সনদ / Birth Registration Certificate</h2>
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
              <div style={{ textAlign: 'center', fontSize: '10px', marginTop: '40px', color: '#555', letterSpacing: '0.5px' }}>{certSettings.footer_text}</div>
            </div>
          </div>
        </div>
      )}
      <CustomAlert isOpen={alertState.isOpen} message={alertState.message} type={alertState.type} onClose={() => setAlertState({ ...alertState, isOpen: false })} />
    </div>
  );
}