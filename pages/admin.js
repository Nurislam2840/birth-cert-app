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
  Building: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>,
  Globe: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>,
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
  
  // 🟢 Zones এবং Wards স্টেট
  const [zones, setZones] = useState([]);
  const [wards, setWards] = useState([]);
  
  const [expandedDivs, setExpandedDivs] = useState(new Set());
  const [expandedDists, setExpandedDists] = useState(new Set());
  const [expandedUpas, setExpandedUpas] = useState(new Set());

  const [showAddDiv, setShowAddDiv] = useState(false);
  const [showAddDist, setShowAddDist] = useState(false);
  const [showAddUpa, setShowAddUpa] = useState(false);

  const [newDiv, setNewDiv] = useState({ name_bn: '', name_en: '' });
  const [newDist, setNewDist] = useState({ division_id: '', name_bn: '', name_en: '', code: '' }); 
  const [newUpa, setNewUpa] = useState({ district_id: '', name_bn: '', name_en: '', code: '', type: 'upazila' }); 

  const [isEditLocOpen, setIsEditLocOpen] = useState(false);
  const [editLocType, setEditLocType] = useState('');
  const [editLocData, setEditLocData] = useState({ id: '', name_bn: '', name_en: '', code: '', type: 'upazila' });

  // 🟢 Zone এবং Ward Modal স্টেট
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [isWardModalOpen, setIsWardModalOpen] = useState(false);
  
  const [newZone, setNewZone] = useState({ upazila_id: '', type: 'city_corp', name_bn: '' });
  const [newWard, setNewWard] = useState({ zone_id: '', ward_no: '', name_bn: '' });

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
    const [divRes, distRes, upaRes, uniRes, zoneRes, wardRes] = await Promise.all([
      supabase.from('divisions').select('*').order('id'),
      supabase.from('districts').select('*').order('id'),
      supabase.from('upazilas').select('*').order('order_index'),
      supabase.from('unions').select('*').order('id'),
      supabase.from('zones').select('*').order('id'),
      supabase.from('wards').select('*').order('id')
    ]);
    setDivisions(divRes.data || []);
    setDistricts(distRes.data || []);
    setUpazilas(upaRes.data || []);
    setUnions(uniRes.data || []);
    setZones(zoneRes.data || []);
    setWards(wardRes.data || []);
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

  const fetchFormFields = async () => {
    const { data } = await supabase.from('form_fields').select('*').order('step').order('order_index');
    setFormFields(data || []);
  };

  const toggleDiv = (id) => { const s = new Set(expandedDivs); s.has(id) ? s.delete(id) : s.add(id); setExpandedDivs(s); };
  const toggleDist = (id) => { const s = new Set(expandedDists); s.has(id) ? s.delete(id) : s.add(id); setExpandedDists(s); };
  const toggleUpa = (id) => { const s = new Set(expandedUpas); s.has(id) ? s.delete(id) : s.add(id); setExpandedUpas(s); };

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

  // 🟢 Zone Add Handler
  const handleAddZone = async (e) => {
    e.preventDefault();
    if (!newZone.upazila_id) return setDebugError('সিটি বা সেনানিবাস নির্বাচন করুন।');

    const { error } = await supabase.from('zones').insert([{
      upazila_id: parseInt(newZone.upazila_id),
      type: newZone.type,
      name_bn: newZone.name_bn,
      name_en: newZone.name_bn // English name not required per user
    }]);

    if (error) return setDebugError(error.message);
    setAlertState({ isOpen: true, message: 'জোন সেভ হয়েছে!', type: 'success' });
    setNewZone({ upazila_id: '', type: 'city_corp', name_bn: '' });
    setIsZoneModalOpen(false);
    fetchAllLocations();
  };

  // 🟢 Ward Add Handler
  const handleAddWard = async (e) => {
    e.preventDefault();
    if (!newWard.zone_id) return setDebugError('জোন নির্বাচন করুন।');

    const { error } = await supabase.from('wards').insert([{
      zone_id: parseInt(newWard.zone_id),
      ward_no: newWard.ward_no,
      name_bn: newWard.name_bn,
    }]);

    if (error) return setDebugError(error.message);
    setAlertState({ isOpen: true, message: 'ওয়ার্ড সেভ হয়েছে!', type: 'success' });
    setNewWard({ zone_id: '', ward_no: '', name_bn: '' });
    setIsWardModalOpen(false);
    fetchAllLocations();
  };

  const handleDeleteZone = async (id) => {
    if (!window.confirm('জোনটি ডিলিট করতে চান?')) return;
    const { error } = await supabase.from('zones').delete().eq('id', id);
    if (error) setDebugError('ডিলিট ব্যর্থ: ' + error.message);
    else { setAlertState({ isOpen: true, message: 'জোন ডিলিট হয়েছে!', type: 'success' }); fetchAllLocations(); }
  };

  const handleDeleteWard = async (id) => {
    if (!window.confirm('ওয়ার্ডটি ডিলিট করতে চান?')) return;
    const { error } = await supabase.from('wards').delete().eq('id', id);
    if (error) setDebugError('ডিলিট ব্যর্থ: ' + error.message);
    else { setAlertState({ isOpen: true, message: 'ওয়ার্ড ডিলিট হয়েছে!', type: 'success' }); fetchAllLocations(); }
  };

  const openEditLoc = (type, data) => { setEditLocType(type); setEditLocData(data); setIsEditLocOpen(true); };

  const handleUpdateLoc = async (e) => {
    e.preventDefault();
    const updateData = { name_bn: editLocData.name_bn, name_en: editLocData.name_en };
    if (editLocType === 'districts' || editLocType === 'upazilas') updateData.code = editLocData.code;
    if (editLocType === 'upazilas') updateData.type = editLocData.type;
    const { error } = await supabase.from(editLocType).update(updateData).eq('id', editLocData.id);
    if (error) return setDebugError('আপডেট ব্যর্থ: ' + error.message);
    setAlertState({ isOpen: true, message: 'আপডেট হয়েছে!', type: 'success' });
    setIsEditLocOpen(false);
    fetchAllLocations();
  };

  const handleDeleteLoc = async (type, id) => {
    if (!window.confirm('নিশ্চিত ডিলিট করবেন?')) return;
    const { error } = await supabase.from(type).delete().eq('id', id);
    if (error) setDebugError('ডিলিট ব্যর্থ: ' + error.message);
    else { setAlertState({ isOpen: true, message: 'ডিলিট হয়েছে!', type: 'success' }); fetchAllLocations(); }
  };

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
    const { error } = await supabase.from('upazilas').insert([{ 
      district_id: parseInt(newUpa.district_id), 
      name_bn: newUpa.name_bn, 
      name_en: newUpa.name_en, 
      code: newUpa.code,
      type: newUpa.type 
    }]);
    if (error) return setDebugError(error.message);
    setAlertState({ isOpen: true, message: 'সেভ হয়েছে!', type: 'success' });
    setNewUpa({ ...newUpa, name_bn: '', name_en: '', code: '' });
    setShowAddUpa(false);
    fetchAllLocations();
  };

  const handleDeleteApplication = async (id) => {
    if (!window.confirm('আবেদনটি চিরতরে ডিলিট করতে চান?')) return;
    try {
      const { error } = await supabase.from('birth_applications').delete().eq('id', id);
      if (error) throw error;
      setApplications(prev => prev.filter(app => app.id !== id));
      setIsViewOpen(false);
      setAlertState({ isOpen: true, message: 'আবেদন ডিলিট হয়েছে!', type: 'success' });
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
    if (!window.confirm('ফিল্ডটি ডিলিট করতে চান?')) return;
    const { error } = await supabase.from('form_fields').delete().eq('id', id);
    if (error) return setDebugError(error.message);
    setAlertState({ isOpen: true, message: 'ফিল্ড ডিলিট হয়েছে!', type: 'success' });
    fetchFormFields();
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
    setAlertState({ isOpen: true, message: 'সেটিংস আপডেট হয়েছে!', type: 'success' });
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
        let rows = text.split(/\r?\n/).map(row => row.trim()).filter(row => row);
        if (rows.length < 2) throw new Error('ফাইলটি খালি বা ভুল ফরম্যাটে আছে।');
        if (rows[0].toLowerCase().includes('division')) rows = rows.slice(1); 

        let importCount = 0;
        let errorCount = 0;
        const existingDivs = new Map();
        const existingDists = new Map();
        const existingUpas = new Map();

        for (const row of rows) {
          if (!row || row.trim() === '' || row === '""') continue; 
          const values = row.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          if (values.length < 9 || !values[0] || !values[2] || !values[5] || !values[8]) { errorCount++; continue; }
          
          const divBn = values[0]; const divEn = values[1] || divBn; 
          const distBn = values[2]; const distEn = values[3] || distBn; const distCode = values[4];
          const upaBn = values[5]; const upaEn = values[6] || upaBn; const upaCode = values[7]; 
          const uniBn = values[8]; const uniEn = values[9] || uniBn;
          
          try {
            let divId;
            if (existingDivs.has(divBn)) divId = existingDivs.get(divBn);
            else {
              const { data: existingDiv } = await supabase.from('divisions').select('id').eq('name_bn', divBn).maybeSingle();
              if (existingDiv) divId = existingDiv.id;
              else {
                const { data: newDiv } = await supabase.from('divisions').insert({ name_bn: divBn, name_en: divEn }).select().single();
                if (newDiv) divId = newDiv.id;
              }
              if (divId) existingDivs.set(divBn, divId);
            }
            if (!divId) { errorCount++; continue; }
            
            let distId;
            const distKey = `${divId}_${distBn}`;
            if (existingDists.has(distKey)) distId = existingDists.get(distKey);
            else {
              const { data: existingDist } = await supabase.from('districts').select('id').eq('name_bn', distBn).eq('division_id', divId).maybeSingle();
              if (existingDist) distId = existingDist.id;
              else {
                const { data: newDist } = await supabase.from('districts').insert({ division_id: divId, name_bn: distBn, name_en: distEn, code: distCode }).select().single();
                if (newDist) distId = newDist.id;
              }
              if (distId) existingDists.set(distKey, distId);
            }
            if (!distId) { errorCount++; continue; }
            
            let upaId;
            const upaKey = `${distId}_${upaBn}`;
            if (existingUpas.has(upaKey)) upaId = existingUpas.get(upaKey);
            else {
              const { data: existingUpa } = await supabase.from('upazilas').select('id').eq('name_bn', upaBn).eq('district_id', distId).maybeSingle();
              if (existingUpa) upaId = existingUpa.id;
              else {
                const { data: newUpa } = await supabase.from('upazilas').insert({ district_id: distId, name_bn: upaBn, name_en: upaEn, code: upaCode }).select().single();
                if (newUpa) upaId = newUpa.id;
              }
              if (upaId) existingUpas.set(upaKey, upaId);
            }
            if (!upaId) { errorCount++; continue; }
            
            const { data: existingUni } = await supabase.from('unions').select('id').eq('name_bn', uniBn).eq('upazila_id', upaId).maybeSingle();
            if (!existingUni) await supabase.from('unions').insert({ upazila_id: upaId, name_bn: uniBn, name_en: uniEn });
            importCount++;
          } catch (err) { errorCount++; }
        }
        await fetchAllLocations();
        setDebugError(null);
        setAlertState({ isOpen: true, message: `ইমপোর্ট সম্পন্ন!\nসফল: ${importCount} টি\nএরর: ${errorCount} টি`, type: 'success' });
        setIsImportOpen(false);
      } catch (err) { setDebugError('CSV এরর: ' + err.message); }
      finally { setIsImporting(false); if(fileInputRef.current) fileInputRef.current.value = ""; }
    };
    reader.readAsText(file, 'UTF-8'); 
  };

  const inputClass = "w-full p-2.5 md:p-3 border border-gray-200 rounded-xl text-xs md:text-sm focus:ring-2 focus:ring-teal-500 outline-none bg-gray-50 focus:bg-white transition-all shadow-sm";

  if (loading) return <div className="text-center mt-20 text-lg font-bold text-teal-700">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans relative overflow-x-hidden">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-gray-900 text-white md:min-h-screen flex flex-col shadow-2xl z-50 sticky top-0 md:relative">
        <div className="p-4 md:p-5 flex items-center gap-3 border-b border-gray-800 bg-gray-950">
          <img src={LOGO_URL} alt="Logo" className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-full p-1 shadow-lg" />
          <div>
            <h1 className="text-xs md:text-sm font-bold tracking-wide text-teal-400">Admin Panel</h1>
            <p className="text-[9px] md:text-[10px] text-gray-400">Birth Registration</p>
          </div>
        </div>
        <nav className="flex-1 flex md:flex-col overflow-x-auto md:overflow-visible p-2 md:p-4 gap-2 hide-scrollbar">
          <button onClick={() => setActiveTab('applications')} className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-xl font-medium text-xs md:text-sm transition-all whitespace-nowrap ${activeTab === 'applications' ? 'bg-teal-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
            <Icons.Dashboard /> <span className="hidden md:inline">Applications</span>
          </button>
          <button onClick={() => setActiveTab('locations')} className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-xl font-medium text-xs md:text-sm transition-all whitespace-nowrap ${activeTab === 'locations' ? 'bg-teal-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
            <Icons.Location /> <span className="hidden md:inline">Locations</span>
          </button>
          <button onClick={() => setActiveTab('specialAreas')} className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-xl font-medium text-xs md:text-sm transition-all whitespace-nowrap ${activeTab === 'specialAreas' ? 'bg-teal-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
            <Icons.Building /> <span className="hidden md:inline">City & Cantonment</span>
          </button>
          <button onClick={() => setActiveTab('formBuilder')} className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-xl font-medium text-xs md:text-sm transition-all whitespace-nowrap ${activeTab === 'formBuilder' ? 'bg-teal-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
            <Icons.Form /> <span className="hidden md:inline">Form Builder</span>
          </button>
          <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-xl font-medium text-xs md:text-sm transition-all whitespace-nowrap ${activeTab === 'settings' ? 'bg-teal-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
            <Icons.Settings /> <span className="hidden md:inline">Settings</span>
          </button>
          
          <div className="mt-4 pt-4 border-t border-gray-800 w-full">
            <Link href="/" className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-xl font-medium text-xs md:text-sm transition-all whitespace-nowrap text-teal-400 hover:bg-teal-600/20 hover:text-teal-300 w-full">
              <Icons.Globe /> <span className="hidden md:inline">Go to Site</span>
            </Link>
          </div>
        </nav>
        <div className="p-3 md:p-4 border-t border-gray-800 hidden md:block bg-gray-950">
          <div className="text-xs text-gray-400 mb-3 truncate px-2">{user?.email}</div>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/admin/login'); }} className="w-full bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2"><Icons.Logout /> Logout</button>
        </div>
      </aside>

      <main className="flex-1 p-3 md:p-8 overflow-y-auto w-full max-w-full">
        {debugError && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 md:p-4 rounded-xl flex justify-between items-start shadow-sm text-xs md:text-sm">
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
              <div className="bg-gradient-to-br from-teal-500 to-teal-700 p-4 md:p-6 rounded-2xl shadow-lg text-white flex items-center justify-between">
                <div><p className="text-teal-100 text-xs md:text-sm font-semibold mb-1">Total Applications</p><h3 className="text-2xl md:text-3xl font-extrabold">{applications.length}</h3></div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-full flex items-center justify-center"><Icons.Users /></div>
              </div>
              <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 p-4 md:p-6 rounded-2xl shadow-lg text-white flex items-center justify-between">
                <div><p className="text-yellow-100 text-xs md:text-sm font-semibold mb-1">Pending</p><h3 className="text-2xl md:text-3xl font-extrabold">{applications.filter(a => a.status === 'Pending').length}</h3></div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-full flex items-center justify-center"><Icons.Pending /></div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-700 p-4 md:p-6 rounded-2xl shadow-lg text-white flex items-center justify-between">
                <div><p className="text-green-100 text-xs md:text-sm font-semibold mb-1">Approved</p><h3 className="text-2xl md:text-3xl font-extrabold">{applications.filter(a => a.status === 'Approved').length}</h3></div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-full flex items-center justify-center"><Icons.Check /></div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden w-full max-w-full">
              <div className="p-4 md:p-6 border-b flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-base md:text-xl font-bold text-gray-800">Recent Applications</h2>
                <div className="relative w-full md:w-80">
                  <input type="text" placeholder="Search ID or Name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 md:py-3 border border-gray-200 rounded-xl text-xs md:text-sm focus:ring-2 focus:ring-teal-500 outline-none bg-gray-50 transition-all" />
                  <div className="absolute left-3 top-2.5 md:top-3.5 text-gray-400"><Icons.Search /></div>
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
                          <td className="px-2 md:px-6 py-3 md:py-4 font-mono font-bold text-teal-700 text-[10px] md:text-sm break-all">{app.tracking_id}</td>
                          <td className="px-2 md:px-6 py-3 md:py-4 min-w-[100px]">
                            <p className="font-bold text-gray-800 text-xs md:text-sm">{app.first_name_bn} {app.last_name_bn}</p>
                            <p className="text-[9px] md:text-xs text-gray-500">{app.first_name_en} {app.last_name_en}</p>
                          </td>
                          <td className="px-2 md:px-6 py-3 md:py-4 text-gray-600 text-[10px] md:text-sm whitespace-nowrap">{new Date(app.created_at).toLocaleDateString('en-GB')}</td>
                          <td className="px-2 md:px-6 py-3 md:py-4">
                            <span className={`inline-flex items-center gap-1 px-1.5 md:px-3 py-0.5 md:py-1.5 rounded-md text-[9px] md:text-xs font-bold whitespace-nowrap ${app.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                              {app.status === 'Pending' ? 'Pending' : 'Approved'}
                            </span>
                          </td>
                          <td className="px-2 md:px-6 py-3 md:py-4">
                            <div className="flex justify-center gap-1 md:gap-3">
                              <button onClick={() => { setSelectedApp(app); setIsViewOpen(true); }} className="p-1 md:p-2 text-gray-500 hover:bg-gray-200 rounded-lg"><Icons.Search /></button>
                              {app.status === 'Pending' ? (
                                <button onClick={() => handleApprove(app)} disabled={busy} className={`px-1.5 md:px-4 py-1 md:py-2 rounded-lg text-[9px] md:text-xs font-bold flex items-center gap-1 ${busy ? 'bg-gray-200 text-gray-400' : 'bg-teal-600 text-white'}`}>
                                  {busy ? 'Wait' : 'Approve'}
                                </button>
                              ) : (
                                app.pdf_url && <button onClick={() => handleDownload(app)} className="px-1.5 md:px-4 py-1 md:py-2 bg-green-600 text-white rounded-lg text-[9px] md:text-xs font-bold flex items-center gap-1"><Icons.Download /> DL</button>
                              )}
                              <button onClick={() => handleDeleteApplication(app.id)} className="p-1 md:p-2 text-red-500 hover:bg-red-100 rounded-lg"><Icons.Trash /></button>
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
                  <h2 className="text-base md:text-xl font-bold text-gray-800">Location Hierarchy</h2>
                  <p className="text-[10px] md:text-sm text-gray-500 mt-1">Manage divisions, districts, upazilas, and unions.</p>
                </div>
                <div className="flex flex-wrap gap-2 md:gap-3 w-full md:w-auto">
                  <button onClick={() => setIsImportOpen(true)} className="flex-1 md:flex-none justify-center bg-teal-600 text-white px-3 md:px-5 py-2 md:py-2.5 rounded-xl font-bold text-[10px] md:text-sm shadow-lg hover:bg-teal-700 flex items-center gap-1 md:gap-2">
                    <Icons.Import /> CSV
                  </button>
                  <button onClick={() => setShowAddDiv(!showAddDiv)} className="flex-1 md:flex-none justify-center bg-blue-600 text-white px-3 md:px-5 py-2 md:py-2.5 rounded-xl font-bold text-[10px] md:text-sm shadow-lg hover:bg-blue-700 flex items-center gap-1 md:gap-2">
                    <Icons.Plus /> Add Div
                  </button>
                </div>
              </div>

              {showAddDiv && (
                <form onSubmit={handleAddDivision} className="bg-teal-50 p-3 md:p-5 rounded-xl border border-teal-100 flex flex-col md:flex-row gap-2 md:gap-4 items-end mb-4 md:mb-6">
                  <div className="flex-1 w-full"><label className="text-[10px] md:text-xs font-bold text-gray-700 uppercase mb-1 block">Division (Bangla)</label><input value={newDiv.name_bn} onChange={e => setNewDiv({...newDiv, name_bn: e.target.value})} className={inputClass} required/></div>
                  <div className="flex-1 w-full"><label className="text-[10px] md:text-xs font-bold text-gray-700 uppercase mb-1 block">Division (English)</label><input value={newDiv.name_en} onChange={e => setNewDiv({...newDiv, name_en: e.target.value})} className={inputClass} required/></div>
                  <button type="submit" className="w-full md:w-auto bg-teal-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl font-bold text-xs md:text-sm hover:bg-teal-700">Save</button>
                </form>
              )}
              {showAddDist && (
                <form onSubmit={handleAddDistrict} className="bg-blue-50 p-3 md:p-5 rounded-xl border border-blue-100 flex flex-col md:flex-row gap-2 md:gap-4 items-end mb-4 md:mb-6">
                  <div className="flex-1 w-full"><label className="text-[10px] md:text-xs font-bold text-gray-700 uppercase mb-1 block">Division</label><CustomSelect name="division_id" options={divisions.map(d => ({ value: d.id.toString(), label: d.name_bn }))} value={newDist.division_id} onChange={(e) => setNewDist({...newDist, division_id: e.target.value})} placeholder="Select Division" /></div>
                  <div className="flex-1 w-full"><label className="text-[10px] md:text-xs font-bold text-gray-700 uppercase mb-1 block">District (Bangla)</label><input value={newDist.name_bn} onChange={e => setNewDist({...newDist, name_bn: e.target.value})} className={inputClass} required/></div>
                  <div className="flex-1 w-full"><label className="text-[10px] md:text-xs font-bold text-gray-700 uppercase mb-1 block">District (English)</label><input value={newDist.name_en} onChange={e => setNewDist({...newDist, name_en: e.target.value})} className={inputClass} required/></div>
                  <div className="flex-1 w-full"><label className="text-[10px] md:text-xs font-bold text-gray-700 uppercase mb-1 block">Code</label><input value={newDist.code || ''} onChange={e => setNewDist({...newDist, code: e.target.value})} placeholder="90" className={inputClass} /></div>
                  <button type="submit" className="w-full md:w-auto bg-blue-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl font-bold text-xs md:text-sm hover:bg-blue-700">Save</button>
                </form>
              )}
              {showAddUpa && (
                <form onSubmit={handleAddUpazila} className="bg-yellow-50 p-3 md:p-5 rounded-xl border border-yellow-100 flex flex-col md:flex-row gap-2 md:gap-4 items-end mb-4 md:mb-6">
                  <div className="flex-1 w-full"><label className="text-[10px] md:text-xs font-bold text-gray-700 uppercase mb-1 block">District</label><CustomSelect name="district_id" options={districts.map(d => ({ value: d.id.toString(), label: d.name_bn }))} value={newUpa.district_id} onChange={(e) => setNewUpa({...newUpa, district_id: e.target.value})} placeholder="Select District" /></div>
                  <div className="flex-1 w-full">
                    <label className="text-[10px] md:text-xs font-bold text-gray-700 uppercase mb-1 block">Type</label>
                    <select value={newUpa.type} onChange={e => setNewUpa({...newUpa, type: e.target.value})} className={inputClass}>
                      <option value="upazila">সাধারণ উপজেলা</option>
                      <option value="city_corp">সিটি কর্পোরেশন</option>
                      <option value="cantonment">সেনানিবাস</option>
                    </select>
                  </div>
                  <div className="flex-1 w-full"><label className="text-[10px] md:text-xs font-bold text-gray-700 uppercase mb-1 block">Name (Bangla)</label><input value={newUpa.name_bn} onChange={e => setNewUpa({...newUpa, name_bn: e.target.value})} className={inputClass} required/></div>
                  <div className="flex-1 w-full"><label className="text-[10px] md:text-xs font-bold text-gray-700 uppercase mb-1 block">Name (English)</label><input value={newUpa.name_en} onChange={e => setNewUpa({...newUpa, name_en: e.target.value})} className={inputClass} required/></div>
                  <div className="flex-1 w-full"><label className="text-[10px] md:text-xs font-bold text-gray-700 uppercase mb-1 block">Code</label><input value={newUpa.code || ''} onChange={e => setNewUpa({...newUpa, code: e.target.value})} placeholder="89" className={inputClass} /></div>
                  <button type="submit" className="w-full md:w-auto bg-yellow-500 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl font-bold text-xs md:text-sm hover:bg-yellow-600">Save</button>
                </form>
              )}

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
                                          {(upa.type === 'city_corp' || upa.type === 'cantonment' || (upa.name_bn || '').includes('সিটি কর্পোরেশন') || (upa.name_bn || '').includes('সেনানিবাস')) ? (
                                            <div className="p-2 md:p-3 border-t">
                                              <div className="flex justify-between items-center mb-2">
                                                <span className="text-[9px] md:text-xs font-bold text-teal-700">ওয়ার্ড/অঞ্চল:</span>
                                                <button onClick={() => { setNewZone({ upazila_id: upa.id.toString(), type: upa.type, name_bn: '' }); setIsZoneModalOpen(true); }} className="text-teal-600 text-[9px] md:text-xs font-bold hover:underline">+ Add</button>
                                              </div>
                                              <div className="flex flex-wrap gap-1.5 md:gap-2">
                                                {zones.filter(z => z.upazila_id === upa.id).map(zone => (
                                                  <span key={zone.id} className="bg-teal-50 text-teal-700 px-1.5 md:px-3 py-0.5 md:py-1 rounded-md text-[9px] md:text-xs font-bold border border-teal-200 flex items-center gap-1">
                                                    {zone.name_bn}
                                                    <button onClick={() => handleDeleteZone(zone.id)} className="text-red-500 hover:text-red-700"><Icons.Trash /></button>
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

        {/* 🟢 City & Cantonment Tab */}
        {activeTab === 'specialAreas' && (
          <div className="bg-white p-3 md:p-6 rounded-2xl shadow-sm border border-gray-100 w-full max-w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-8 gap-4">
              <div>
                <h2 className="text-base md:text-xl font-bold text-gray-800">City & Cantonment</h2>
                <p className="text-[10px] md:text-sm text-gray-500 mt-1">Manage Zone, and Wards for City Corporations and Cantonments.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setNewZone({ upazila_id: '', type: 'city_corp', name_bn: '' }); setIsZoneModalOpen(true); }} className="bg-teal-600 text-white px-3 md:px-5 py-2 md:py-2.5 rounded-xl font-bold text-[10px] md:text-sm shadow-lg hover:bg-teal-700 flex items-center gap-1 md:gap-2">
                  <Icons.Plus /> Add New Zone
                </button>
                <button onClick={() => { setNewWard({ zone_id: '', ward_no: '', name_bn: '' }); setIsWardModalOpen(true); }} className="bg-blue-600 text-white px-3 md:px-5 py-2 md:py-2.5 rounded-xl font-bold text-[10px] md:text-sm shadow-lg hover:bg-blue-700 flex items-center gap-1 md:gap-2">
                  <Icons.Plus /> Add New Ward
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-gray-700 mb-2">Zones / Areas</h3>
                <div className="border border-gray-200 rounded-xl overflow-hidden w-full max-w-full">
                  <div className="overflow-x-auto w-full hide-scrollbar">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-600 uppercase text-[10px] tracking-wider font-semibold">
                        <tr>
                          <th className="px-2 md:px-4 py-3">সিটি/সেনানিবাস</th>
                          <th className="px-2 md:px-4 py-3">TYPE</th>
                          <th className="px-2 md:px-4 py-3">NAME</th>
                          <th className="px-2 md:px-4 py-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {zones.map(area => {
                          const parentUpa = upazilas.find(u => u.id === area.upazila_id);
                          return (
                            <tr key={area.id} className="hover:bg-gray-50">
                              <td className="px-2 md:px-4 py-3 font-bold text-gray-800 text-xs md:text-sm">{parentUpa ? parentUpa.name_bn : 'N/A'}</td>
                              <td className="px-2 md:px-4 py-3 text-teal-700 font-bold text-xs md:text-sm whitespace-nowrap">{area.type === 'city_corp' ? 'City Corp' : 'Cantonment'}</td>
                              <td className="px-2 md:px-4 py-3 text-xs md:text-sm">{area.name_bn}</td>
                              <td className="px-2 md:px-4 py-3">
                                <div className="flex justify-center gap-1 md:gap-2">
                                  <button onClick={() => handleDeleteZone(area.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Icons.Trash /></button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {zones.length === 0 && <tr><td colSpan="4" className="text-center py-8 text-gray-500 text-xs md:text-sm">No data found. Add a new zone.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-700 mb-2">Wards (City Corp Only)</h3>
                <div className="border border-gray-200 rounded-xl overflow-hidden w-full max-w-full">
                  <div className="overflow-x-auto w-full hide-scrollbar">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-600 uppercase text-[10px] tracking-wider font-semibold">
                        <tr>
                          <th className="px-2 md:px-4 py-3">ZONE</th>
                          <th className="px-2 md:px-4 py-3">WARD NO</th>
                          <th className="px-2 md:px-4 py-3">NAME</th>
                          <th className="px-2 md:px-4 py-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {wards.map(ward => {
                          const parentZone = zones.find(z => z.id === ward.zone_id);
                          return (
                            <tr key={ward.id} className="hover:bg-gray-50">
                              <td className="px-2 md:px-4 py-3 font-bold text-gray-800 text-xs md:text-sm">{parentZone ? parentZone.name_bn : 'N/A'}</td>
                              <td className="px-2 md:px-4 py-3 text-gray-700 text-xs md:text-sm">{ward.ward_no}</td>
                              <td className="px-2 md:px-4 py-3 text-xs md:text-sm">{ward.name_bn}</td>
                              <td className="px-2 md:px-4 py-3">
                                <div className="flex justify-center gap-1 md:gap-2">
                                  <button onClick={() => handleDeleteWard(ward.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Icons.Trash /></button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {wards.length === 0 && <tr><td colSpan="4" className="text-center py-8 text-gray-500 text-xs md:text-sm">No data found. Add a new ward.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'formBuilder' && (
          <div className="bg-white p-3 md:p-6 rounded-2xl shadow-sm border border-gray-100 w-full max-w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-8 gap-4">
              <div>
                <h2 className="text-base md:text-xl font-bold text-gray-800">Dynamic Form Builder</h2>
                <p className="text-[10px] md:text-sm text-gray-500 mt-1">Add, edit or delete form fields that appear on the Apply page.</p>
              </div>
              <button onClick={() => setIsAddFieldOpen(true)} className="bg-teal-600 text-white px-3 md:px-5 py-2 md:py-2.5 rounded-xl font-bold text-[10px] md:text-sm shadow-lg hover:bg-teal-700 flex items-center gap-1 md:gap-2">
                <Icons.Plus /> Add New Field
              </button>
            </div>

            <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden w-full max-w-full">
              <div className="overflow-x-auto w-full hide-scrollbar">
                <table className="w-full text-sm text-left min-w-[600px] md:min-w-full">
                  <thead className="bg-gray-50 text-gray-600 uppercase text-[10px] tracking-wider font-semibold">
                    <tr>
                      <th className="px-2 md:px-3 py-2 md:py-3 whitespace-nowrap">Field Name</th>
                      <th className="px-2 md:px-3 py-2 md:py-3 whitespace-nowrap">Label</th>
                      <th className="px-2 md:px-3 py-2 md:py-3 whitespace-nowrap">Section</th>
                      <th className="px-2 md:px-3 py-2 md:py-3 whitespace-nowrap">Type</th>
                      <th className="px-2 md:px-3 py-2 md:py-3 whitespace-nowrap">Step</th>
                      <th className="px-2 md:px-3 py-2 md:py-3 whitespace-nowrap text-center">Req</th>
                      <th className="px-2 md:px-3 py-2 md:py-3 text-center whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {formFields.map(field => (
                      <tr key={field.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-2 md:px-3 py-2 md:py-3 font-mono text-[10px] md:text-[11px] text-teal-600 break-all">{field.field_name}</td>
                        <td className="px-2 md:px-3 py-2 md:py-3 font-medium text-gray-800 text-[10px] md:text-xs min-w-[100px]">{field.label_bn}</td>
                        <td className="px-2 md:px-3 py-2 md:py-3 text-gray-600">
                          <span className="px-1.5 md:px-2 py-0.5 md:py-1 bg-gray-100 rounded text-[9px] md:text-[10px] font-bold">{field.section || 'main'}</span>
                        </td>
                        <td className="px-2 md:px-3 py-2 md:py-3 text-gray-600 capitalize text-[10px] md:text-xs">{field.field_type}</td>
                        <td className="px-2 md:px-3 py-2 md:py-3 text-gray-600 text-center text-[10px] md:text-xs">{field.step}</td>
                        <td className="px-2 md:px-3 py-2 md:py-3 text-center">
                          <span className={`px-1.5 md:px-2 py-0.5 md:py-1 rounded text-[9px] md:text-[10px] font-bold ${field.is_required ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                            {field.is_required ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-2 md:px-3 py-2 md:py-3">
                          <div className="flex justify-center gap-1">
                            <button onClick={() => setEditField(field)} className="p-1 md:p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Icons.Edit /></button>
                            <button onClick={() => handleDeleteField(field.id)} className="p-1 md:p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Icons.Trash /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-gray-100 max-w-4xl mx-auto">
            <h2 className="text-base md:text-xl font-bold text-gray-800 mb-4 md:mb-6 flex items-center gap-2 border-b pb-3 md:pb-4"><Icons.Settings /> Certificate Settings</h2>
            <form onSubmit={handleUpdateSettings} className="space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-gray-700 uppercase mb-1 md:mb-2">Govt. Name</label>
                  <input value={certSettings.govt_name || ''} onChange={(e) => setCertSettings({...certSettings, govt_name: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-gray-700 uppercase mb-1 md:mb-2">Office Name</label>
                  <input value={certSettings.office_name || ''} onChange={(e) => setCertSettings({...certSettings, office_name: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-gray-700 uppercase mb-1 md:mb-2">Rule Text</label>
                  <input value={certSettings.rule_text || ''} onChange={(e) => setCertSettings({...certSettings, rule_text: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-gray-700 uppercase mb-1 md:mb-2">QR Prefix</label>
                  <input value={certSettings.qr_prefix || ''} onChange={(e) => setCertSettings({...certSettings, qr_prefix: e.target.value})} className={inputClass} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] md:text-xs font-bold text-gray-700 uppercase mb-1 md:mb-2">Custom Union Name</label>
                  <input value={certSettings.custom_union_name || ''} onChange={(e) => setCertSettings({...certSettings, custom_union_name: e.target.value})} className={inputClass} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] md:text-xs font-bold text-gray-700 uppercase mb-1 md:mb-2">Footer Text</label>
                  <textarea rows="3" value={certSettings.footer_text || ''} onChange={(e) => setCertSettings({...certSettings, footer_text: e.target.value})} className={inputClass} />
                </div>
              </div>
              <div className="flex justify-end pt-3 md:pt-4 border-t">
                <button type="submit" disabled={isSavingSettings} className="bg-teal-600 text-white px-6 md:px-8 py-2 md:py-3 rounded-xl font-bold text-xs md:text-sm hover:bg-teal-700 transition disabled:bg-gray-400 flex items-center gap-2">
                  {isSavingSettings ? 'Saving...' : <><Icons.Check /> Save Changes</>}
                </button>
              </div>
            </form>
          </div>
        )}

        {isImportOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[90] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
              <div className="px-4 md:px-6 py-3 md:py-5 border-b bg-gray-50 flex justify-between items-center">
                <h3 className="text-base md:text-lg font-bold text-gray-800 flex items-center gap-2"><Icons.Import /> Import Data</h3>
                <button onClick={() => setIsImportOpen(false)} className="text-gray-400 hover:text-red-500 bg-white p-1 rounded-full shadow-sm"><Icons.Close /></button>
              </div>
              <div className="p-4 md:p-8 text-center">
                <h4 className="text-sm md:text-base font-bold text-gray-800 mb-1">Upload CSV File</h4>
                <p className="text-xs text-gray-500 mb-4">আপনার ফাইলটি নির্বাচন করুন</p>
                <input type="file" accept=".csv" ref={fileInputRef} onChange={handleCSVImport} className="hidden" id="csv-upload" disabled={isImporting} />
                <label htmlFor="csv-upload" className={`flex items-center justify-center w-full py-2.5 px-4 border-2 border-dashed ${isImporting ? 'border-gray-300 bg-gray-50 text-gray-400' : 'border-teal-400 bg-teal-50 text-teal-700 hover:bg-teal-100 cursor-pointer'} rounded-xl font-bold text-sm transition-all`}>
                  {isImporting ? 'অপেক্ষা করুন...' : '+ Choose File'}
                </label>
                {isImporting && (
                  <div className="mt-4 flex flex-col items-center justify-center bg-blue-50 p-3 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-blue-700 font-bold text-xs">ফাইল প্রসেস হচ্ছে...</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="px-4 md:px-6 py-3 md:py-4 border-t bg-gray-50 text-right">
                <button onClick={() => setIsImportOpen(false)} className="px-4 md:px-6 py-2 text-gray-600 font-bold text-xs md:text-sm hover:bg-gray-200 rounded-xl" disabled={isImporting}>Close</button>
              </div>
            </div>
          </div>
        )}

        {isAddFieldOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[90] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="px-4 md:px-6 py-3 md:py-4 border-b bg-gray-50 flex justify-between items-center">
                <h3 className="text-base md:text-lg font-bold">Add New Field</h3>
                <button onClick={() => setIsAddFieldOpen(false)} className="text-gray-400 hover:text-red-500 bg-white p-1 rounded-full shadow-sm"><Icons.Close /></button>
              </div>
              <form onSubmit={handleAddField} className="p-4 md:p-6 space-y-3 md:space-y-4">
                <div><label className="text-[10px] md:text-xs font-bold text-gray-700">Field Name</label><input value={newField.field_name} onChange={e => setNewField({...newField, field_name: e.target.value})} className={inputClass} required/></div>
                <div><label className="text-[10px] md:text-xs font-bold text-gray-700">Label (Bangla)</label><input value={newField.label_bn} onChange={e => setNewField({...newField, label_bn: e.target.value})} className={inputClass} required/></div>
                <div>
                  <label className="text-[10px] md:text-xs font-bold text-gray-700">Section</label>
                  <select value={newField.section} onChange={e => setNewField({...newField, section: e.target.value})} className={inputClass}>
                    <option value="main">Main Details (Step 1 & 2)</option>
                    <option value="birth">Birth Address (Step 3)</option>
                    <option value="permanent">Permanent Address (Step 3)</option>
                  </select>
                </div>
                <div><label className="text-[10px] md:text-xs font-bold text-gray-700">Step</label><input type="number" value={newField.step} onChange={e => setNewField({...newField, step: parseInt(e.target.value)})} className={inputClass} required/></div>
                <div>
                  <label className="text-[10px] md:text-xs font-bold text-gray-700">Field Type</label>
                  <select value={newField.field_type} onChange={e => setNewField({...newField, field_type: e.target.value})} className={inputClass}>
                    <option value="text">Text</option>
                    <option value="date">Date</option>
                    <option value="number">Number</option>
                    <option value="select">Select</option>
                  </select>
                </div>
                {newField.field_type === 'select' && (
                  <div><label className="text-[10px] md:text-xs font-bold text-gray-700">Options (Comma separated)</label><input value={newField.options ? newField.options.join(',') : ''} onChange={e => setNewField({...newField, options: e.target.value.split(',')})} className={inputClass} /></div>
                )}
                <div className="flex justify-end pt-3 md:pt-4">
                  <button type="submit" className="bg-teal-600 text-white px-4 md:px-6 py-2 rounded-xl font-bold text-xs md:text-sm">Save Field</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {editField && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[90] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="px-4 md:px-6 py-3 md:py-4 border-b bg-gray-50 flex justify-between items-center">
                <h3 className="text-base md:text-lg font-bold">Edit Field</h3>
                <button onClick={() => setEditField(null)} className="text-gray-400 hover:text-red-500 bg-white p-1 rounded-full shadow-sm"><Icons.Close /></button>
              </div>
              <form onSubmit={handleUpdateField} className="p-4 md:p-6 space-y-3 md:space-y-4">
                <div><label className="text-[10px] md:text-xs font-bold text-gray-700">Field Name</label><input value={editField.field_name} onChange={e => setEditField({...editField, field_name: e.target.value})} className={inputClass} required/></div>
                <div><label className="text-[10px] md:text-xs font-bold text-gray-700">Label (Bangla)</label><input value={editField.label_bn} onChange={e => setEditField({...editField, label_bn: e.target.value})} className={inputClass} required/></div>
                <div>
                  <label className="text-[10px] md:text-xs font-bold text-gray-700">Section</label>
                  <select value={editField.section || 'main'} onChange={e => setEditField({...editField, section: e.target.value})} className={inputClass}>
                    <option value="main">Main Details (Step 1 & 2)</option>
                    <option value="birth">Birth Address (Step 3)</option>
                    <option value="permanent">Permanent Address (Step 3)</option>
                  </select>
                </div>
                <div><label className="text-[10px] md:text-xs font-bold text-gray-700">Step</label><input type="number" value={editField.step} onChange={e => setEditField({...editField, step: parseInt(e.target.value)})} className={inputClass} required/></div>
                <div>
                  <label className="text-[10px] md:text-xs font-bold text-gray-700">Field Type</label>
                  <select value={editField.field_type} onChange={e => setEditField({...editField, field_type: e.target.value})} className={inputClass}>
                    <option value="text">Text</option>
                    <option value="date">Date</option>
                    <option value="number">Number</option>
                    <option value="select">Select</option>
                  </select>
                </div>
                {editField.field_type === 'select' && (
                  <div><label className="text-[10px] md:text-xs font-bold text-gray-700">Options (Comma separated)</label><input value={editField.options ? editField.options.join(',') : ''} onChange={e => setEditField({...editField, options: e.target.value.split(',')})} className={inputClass} /></div>
                )}
                <div className="flex justify-end pt-3 md:pt-4">
                  <button type="submit" className="bg-blue-600 text-white px-4 md:px-6 py-2 rounded-xl font-bold text-xs md:text-sm">Update Field</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isEditLocOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[90] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
              <div className="px-4 md:px-6 py-3 md:py-4 border-b bg-gray-50 flex justify-between items-center">
                <h3 className="text-base md:text-lg font-bold text-gray-800">Edit Location</h3>
                <button onClick={() => setIsEditLocOpen(false)} className="text-gray-400 hover:text-red-500 bg-white p-1 rounded-full shadow-sm"><Icons.Close /></button>
              </div>
              <form onSubmit={handleUpdateLoc} className="p-4 md:p-6 space-y-3 md:space-y-4">
                <div><label className="text-[10px] md:text-xs font-bold text-gray-700 uppercase mb-1 block">Name (Bangla)</label><input value={editLocData.name_bn || ''} onChange={(e) => setEditLocData({ ...editLocData, name_bn: e.target.value })} className={inputClass} required /></div>
                <div><label className="text-[10px] md:text-xs font-bold text-gray-700 uppercase mb-1 block">Name (English)</label><input value={editLocData.name_en || ''} onChange={(e) => setEditLocData({ ...editLocData, name_en: e.target.value })} className={inputClass} required /></div>
                {editLocType === 'upazilas' && (
                  <div>
                    <label className="text-[10px] md:text-xs font-bold text-gray-700 uppercase mb-1 block">Type</label>
                    <select value={editLocData.type || 'upazila'} onChange={(e) => setEditLocData({ ...editLocData, type: e.target.value })} className={inputClass}>
                      <option value="upazila">সাধারণ উপজেলা</option>
                      <option value="city_corp">সিটি কর্পোরেশন</option>
                      <option value="cantonment">সেনানিবাস</option>
                    </select>
                  </div>
                )}
                {(editLocType === 'districts' || editLocType === 'upazilas') && (
                  <div><label className="text-[10px] md:text-xs font-bold text-gray-700 uppercase mb-1 block">Code (2 Digits)</label><input value={editLocData.code || ''} onChange={(e) => setEditLocData({ ...editLocData, code: e.target.value })} className={inputClass} /></div>
                )}
                <div className="flex justify-end gap-2 md:gap-3 pt-3 md:pt-4">
                  <button type="button" onClick={() => setIsEditLocOpen(false)} className="px-4 md:px-5 py-2 md:py-2.5 text-gray-600 font-bold text-xs md:text-sm hover:bg-gray-100 rounded-xl">Cancel</button>
                  <button type="submit" className="px-4 md:px-5 py-2 md:py-2.5 bg-teal-600 text-white rounded-xl font-bold text-xs md:text-sm hover:bg-teal-700 shadow-md">Update</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isViewOpen && selectedApp && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-100">
              <div className="flex justify-between items-center px-4 md:px-8 py-3 md:py-5 border-b bg-gray-50">
                <div className="flex items-center gap-2 md:gap-4">
                  <div className="w-8 h-8 md:w-12 md:h-12 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-bold text-sm md:text-xl">{selectedApp.first_name_en?.charAt(0) || 'A'}</div>
                  <div>
                    <h3 className="text-base md:text-xl font-bold text-gray-800">Application Details</h3>
                    <p className="text-[10px] md:text-sm text-teal-600 font-mono font-semibold">ID: {selectedApp.tracking_id}</p>
                  </div>
                </div>
                <button onClick={() => setIsViewOpen(false)} className="text-gray-400 hover:text-red-600 bg-white p-1.5 md:p-2 rounded-full shadow-sm"><Icons.Close /></button>
              </div>

              <div className="p-4 md:p-8 overflow-y-auto flex-1 space-y-4 md:space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                  <div className="bg-gray-50 rounded-2xl p-4 md:p-6 border border-gray-100 shadow-sm">
                    <h4 className="text-xs md:text-sm font-bold text-teal-700 uppercase mb-3 md:mb-4 border-b pb-2 flex items-center gap-2"><Icons.Users /> Applicant Info</h4>
                    <div className="space-y-2 md:space-y-4 text-xs md:text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">Name (BN):</span> <span className="font-bold text-gray-800">{selectedApp.first_name_bn} {selectedApp.last_name_bn}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Name (EN):</span> <span className="font-bold text-gray-800">{selectedApp.first_name_en} {selectedApp.last_name_en}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">DOB:</span> <span className="font-bold text-gray-800">{selectedApp.dob}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Gender:</span> <span className="font-bold text-gray-800">{selectedApp.gender}</span></div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4 md:p-6 border border-gray-100 shadow-sm">
                    <h4 className="text-xs md:text-sm font-bold text-teal-700 uppercase mb-3 md:mb-4 border-b pb-2 flex items-center gap-2"><Icons.Users /> Parent's Info</h4>
                    <div className="space-y-2 md:space-y-4 text-xs md:text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">Father:</span> <span className="font-bold text-gray-800">{selectedApp.father_name_bn}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Mother:</span> <span className="font-bold text-gray-800">{selectedApp.mother_name_bn}</span></div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4 md:p-6 border border-gray-100 md:col-span-2 shadow-sm">
                    <h4 className="text-xs md:text-sm font-bold text-teal-700 uppercase mb-3 md:mb-4 border-b pb-2 flex items-center gap-2"><Icons.Location /> Address</h4>
                    <div className="space-y-3 text-xs md:text-sm">
                      <div><p className="text-gray-500 mb-1">Present:</p><p className="font-medium text-gray-800 bg-white p-3 rounded-xl border">{selectedApp.house_road_bn}, {selectedApp.village_bn}, {selectedApp.post_office_bn}, {selectedApp.union_name}, {selectedApp.city_corp}, {selectedApp.district}</p></div>
                      <div><p className="text-gray-500 mb-1">Permanent:</p><p className="font-medium text-gray-800 bg-white p-3 rounded-xl border">{selectedApp.permanent_same ? 'Same as Present' : `${selectedApp.permanent_village_bn || ''}, ${selectedApp.permanent_district || ''}`}</p></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-4 md:px-8 py-3 md:py-5 border-t bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-3">
                <div className={`px-3 py-1 rounded-lg text-xs md:text-sm font-bold ${selectedApp.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{selectedApp.status}</div>
                <div className="flex gap-2 w-full md:w-auto">
                  <button onClick={() => handleDeleteApplication(selectedApp.id)} className="flex-1 md:flex-none px-3 md:px-5 py-2 bg-red-100 text-red-700 rounded-xl font-bold text-xs md:text-sm hover:bg-red-200">Delete</button>
                  {selectedApp.pdf_url && (
                    <button onClick={() => handleDownload(selectedApp)} className="flex-1 md:flex-none px-3 md:px-5 py-2 bg-green-600 text-white rounded-xl font-bold text-xs md:text-sm hover:bg-green-700 flex items-center justify-center gap-1"><Icons.Download /> Download</button>
                  )}
                  <button onClick={() => setIsViewOpen(false)} className="flex-1 md:flex-none px-3 md:px-5 py-2 bg-gray-800 text-white rounded-xl font-bold text-xs md:text-sm hover:bg-gray-900">Close</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 🟢 Add Zone Modal */}
        {isZoneModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[90] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="px-4 md:px-6 py-3 md:py-4 border-b bg-gray-50 flex justify-between items-center">
                <h3 className="text-base md:text-lg font-bold">Add New Zone/Area</h3>
                <button onClick={() => setIsZoneModalOpen(false)} className="text-gray-400 hover:text-red-500 bg-white p-1 rounded-full shadow-sm"><Icons.Close /></button>
              </div>
              <form onSubmit={handleAddZone} className="p-4 md:p-6 space-y-3 md:space-y-4">
                <div>
                  <label className="text-[10px] md:text-xs font-bold text-gray-700">সিটি কর্পোরেশন / সেনানিবাস</label>
                  <select 
                    value={newZone.upazila_id} 
                    onChange={e => {
                      const upaId = e.target.value;
                      const selectedUpa = upazilas.find(u => u.id.toString() === upaId);
                      let upaType = 'city_corp';
                      if (selectedUpa?.type === 'cantonment' || (selectedUpa?.name_bn || '').includes('সেনানিবাস') || (selectedUpa?.name_en || '').toLowerCase().includes('cantonment')) {
                        upaType = 'cantonment';
                      }
                      setNewZone({...newZone, upazila_id: upaId, type: upaType});
                    }} 
                    className={inputClass}
                    required
                  >
                    <option value="">সিলেক্ট করুন</option>
                    {upazilas.filter(u => 
                      u.type === 'city_corp' || 
                      u.type === 'cantonment' || 
                      (u.name_bn || '').includes('সিটি কর্পোরেশন') || 
                      (u.name_bn || '').includes('ক্যান্টনমেন্ট') || 
                      (u.name_bn || '').includes('সেনানিবাস') || 
                      (u.name_en || '').toLowerCase().includes('city corporation') ||
                      (u.name_en || '').toLowerCase().includes('cantonment')
                    ).map(u => (
                      <option key={u.id} value={u.id}>{u.name_bn}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] md:text-xs font-bold text-gray-700">Zone/Area Name (বাংলা)</label>
                  <input value={newZone.name_bn} onChange={e => setNewZone({...newZone, name_bn: e.target.value})} className={inputClass} required placeholder="যেমন: জোন ১ / বিবিসি ওয়ার্ড ০১" />
                </div>
                <div className="flex justify-end pt-3 md:pt-4">
                  <button type="submit" className="bg-teal-600 text-white px-4 md:px-6 py-2 rounded-xl font-bold text-xs md:text-sm">Save Zone</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 🟢 Add Ward Modal */}
        {isWardModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[90] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="px-4 md:px-6 py-3 md:py-4 border-b bg-gray-50 flex justify-between items-center">
                <h3 className="text-base md:text-lg font-bold">Add New Ward</h3>
                <button onClick={() => setIsWardModalOpen(false)} className="text-gray-400 hover:text-red-500 bg-white p-1 rounded-full shadow-sm"><Icons.Close /></button>
              </div>
              <form onSubmit={handleAddWard} className="p-4 md:p-6 space-y-3 md:space-y-4">
                <div>
                  <label className="text-[10px] md:text-xs font-bold text-gray-700">জোন / ওয়ার্ড-অঞ্চল</label>
                  <select 
                    value={newWard.zone_id} 
                    onChange={e => setNewWard({...newWard, zone_id: e.target.value})} 
                    className={inputClass}
                    required
                  >
                    <option value="">সিলেক্ট করুন</option>
                    {zones.map(z => (
                      <option key={z.id} value={z.id}>{z.name_bn} ({upazilas.find(u => u.id === z.upazila_id)?.name_bn})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] md:text-xs font-bold text-gray-700">Ward No (যেমন: 01)</label>
                  <input value={newWard.ward_no} onChange={e => setNewWard({...newWard, ward_no: e.target.value})} className={inputClass} required placeholder="01" />
                </div>
                <div>
                  <label className="text-[10px] md:text-xs font-bold text-gray-700">Ward Name (বাংলা)</label>
                  <input value={newWard.name_bn} onChange={e => setNewWard({...newWard, name_bn: e.target.value})} className={inputClass} required placeholder="যেমন: ১ নং ওয়ার্ড" />
                </div>
                <div className="flex justify-end pt-3 md:pt-4">
                  <button type="submit" className="bg-blue-600 text-white px-4 md:px-6 py-2 rounded-xl font-bold text-xs md:text-sm">Save Ward</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 🟢 PDF Template */}
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