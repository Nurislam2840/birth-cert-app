import { useState, useEffect } from 'react';
import { supabase, isAdmin, ASSETS_BUCKET_URL } from '../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import CustomAlert from '../components/CustomAlert';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import pdfMake from 'pdfmake/build/pdfmake';
import { vfs } from '../lib/vfs_fonts';

pdfMake.vfs = vfs;
pdfMake.fonts = {
  NotoSansBengali: {
    normal: 'NotoSansBengali-Regular.ttf',
    bold: 'NotoSansBengali-Regular.ttf',
    italics: 'NotoSansBengali-Regular.ttf',
    bolditalics: 'NotoSansBengali-Regular.ttf',
  },
};

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

  // 🟢 স্ক্রিনে প্রোগ্রেস ও এরর দেখানোর জন্য স্টেট
  const [debugError, setDebugError] = useState(null);

  const [locationList, setLocationList] = useState([]);
  const [newLoc, setNewLoc] = useState({
    division_name: '', division_en: '',
    district_name: '', district_en: '',
    upazila_name: '', upazila_en: '',
    union_name: '', union_en: '',
  });
  const [isAddingLoc, setIsAddingLoc] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editLocData, setEditLocData] = useState({
    id: '', division_name: '', division_en: '', district_name: '', district_en: '', upazila_name: '', upazila_en: '', union_name: '', union_en: '',
  });

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isAdmin(user.email)) {
        router.push('/admin/login');
        return;
      }
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
    } catch (err) {
      setErrorMsg('ডেটা লোডে সমস্যা: ' + err.message);
    }
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
    } catch (err) {
      setDebugError('ডিলিটে সমস্যা: ' + err.message);
    }
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
    } catch (err) {
      throw new Error(`ছবি (${fileName}) লোড করতে সমস্যা: ` + err.message);
    }
  };

  const buildDocDefinition = (app, qrCodeUrl, barcodeUrl, logoDataUrl, watermarkDataUrl) => {
    return {
      pageSize: 'A4',
      pageMargins: [40, 35, 40, 35],
      content: [
        {
          columns: [
            { width: 100, stack: [ qrCodeUrl ? { image: qrCodeUrl, width: 70, height: 70 } : { text: '' }, { text: 'ASERTR', fontSize: 9, margin: [0, 5, 0, 0], alignment: 'center' } ] },
            {
              width: '*',
              stack: [
                logoDataUrl ? { image: logoDataUrl, width: 50, alignment: 'center' } : { text: '' },
                { text: "Government of the People's Republic of Bangladesh", fontSize: 14, bold: true, alignment: 'center', margin: [0, 5, 0, 0] },
                { text: 'Office of the Register, Birth and Death Registration', fontSize: 9, alignment: 'center', margin: [0, 2, 0, 0] },
                { text: `${safe(app.union_name)}, ${safe(app.city_corp)}, ${safe(app.district)}`, fontSize: 10, alignment: 'center', margin: [0, 10, 0, 0] },
                { text: '(Rule 9, 10)', fontSize: 8, alignment: 'center', margin: [0, 2, 0, 0] },
              ],
            },
            { width: 120, stack: [ barcodeUrl ? { image: barcodeUrl, width: 130, height: 45, alignment: 'right' } : { text: '' } ] },
          ],
          margin: [0, 0, 0, 10],
        },
        { text: 'জন্ম নিবন্ধন সনদ / Birth Registration Certificate', fontSize: 16, bold: true, alignment: 'center', margin: [0, 10, 0, 15] },
        {
          columns: [
            { width: '30%', stack: [{ text: 'Date of Registration', fontSize: 9, bold: true }, { text: new Date().toLocaleDateString('en-GB'), fontSize: 10, margin: [0, 3, 0, 0] }] },
            { width: '40%', stack: [{ text: 'Birth Registration Number', fontSize: 9, bold: true, alignment: 'center' }, { text: safe(app.tracking_id) || 'N/A', fontSize: 11, bold: true, alignment: 'center', margin: [0, 3, 0, 0] }] },
            { width: '30%', stack: [{ text: 'Date of Issuance', fontSize: 9, bold: true, alignment: 'right' }, { text: new Date().toLocaleDateString('en-GB'), fontSize: 10, alignment: 'right', margin: [0, 3, 0, 0] }] },
          ],
          margin: [0, 0, 0, 20],
        },
        { columns: [{ text: 'Date of Birth', width: '20%', fontSize: 10 }, { text: `: ${safe(app.dob)}`, width: '35%', fontSize: 10 }, { text: 'Sex', width: '15%', fontSize: 10 }, { text: `: ${safe(app.gender) === 'পুরুষ' ? 'Male' : safe(app.gender) === 'মহিলা' ? 'Female' : 'Hijra'}`, width: '*', fontSize: 10 }], margin: [0, 0, 0, 8] },
        { columns: [{ text: 'In Word', width: '20%', fontSize: 10 }, { text: `: ${dateToWords(safe(app.dob))}`, width: '*', fontSize: 10 }], margin: [0, 0, 0, 15] },
        { columns: [{ text: 'নাম', width: '15%', fontSize: 11 }, { text: `: ${safe(app.first_name_bn)} ${safe(app.last_name_bn)}`, width: '35%', fontSize: 11 }, { text: 'Name', width: '15%', fontSize: 10 }, { text: `: ${safe(app.first_name_en)} ${safe(app.last_name_en)}`, width: '*', fontSize: 10 }], margin: [0, 0, 0, 5] },
        { columns: [{ text: 'মাতা', width: '15%', fontSize: 11 }, { text: `: ${safe(app.mother_name_bn)}`, width: '35%', fontSize: 11 }, { text: 'Mother', width: '15%', fontSize: 10 }, { text: `: ${safe(app.mother_name_en)}`, width: '*', fontSize: 10 }], margin: [0, 0, 0, 5] },
        { columns: [{ text: 'মাতার জাতীয়তা', width: '15%', fontSize: 11 }, { text: ': বাংলাদেশী', width: '35%', fontSize: 11 }, { text: 'Nationality', width: '15%', fontSize: 10 }, { text: ': Bangladeshi', width: '*', fontSize: 10 }], margin: [0, 0, 0, 5] },
        { columns: [{ text: 'পিতা', width: '15%', fontSize: 11 }, { text: `: ${safe(app.father_name_bn)}`, width: '35%', fontSize: 11 }, { text: 'Father', width: '15%', fontSize: 10 }, { text: `: ${safe(app.father_name_en)}`, width: '*', fontSize: 10 }], margin: [0, 0, 0, 5] },
        { columns: [{ text: 'পিতার জাতীয়তা', width: '15%', fontSize: 11 }, { text: ': বাংলাদেশী', width: '35%', fontSize: 11 }, { text: 'Nationality', width: '15%', fontSize: 10 }, { text: ': Bangladeshi', width: '*', fontSize: 10 }], margin: [0, 0, 0, 5] },
        { columns: [{ text: 'জন্মস্থান', width: '15%', fontSize: 11 }, { text: `: ${safe(app.village_bn)}, ${safe(app.district)}, বাংলাদেশ`, width: '35%', fontSize: 11 }, { text: 'Place of Birth', width: '15%', fontSize: 10 }, { text: `: ${safe(app.village_en)}, ${safe(app.district_en) || safe(app.district)}, Bangladesh`, width: '*', fontSize: 10 }], margin: [0, 0, 0, 5] },
        { columns: [{ text: 'স্থায়ী ঠিকানা', width: '15%', fontSize: 11 }, { text: `: ${safe(app.house_road_bn)}, ${safe(app.village_bn)}, ${safe(app.post_office_bn)}, ${safe(app.district)}।`, width: '35%', fontSize: 11 }, { text: 'Permanent\nAddress', width: '15%', fontSize: 10 }, { text: `: ${safe(app.house_road_en)}, ${safe(app.village_en)}, ${safe(app.post_office_en)}, ${safe(app.district_en) || safe(app.district)}.`, width: '*', fontSize: 10 }] },
      ],
      defaultStyle: { font: 'NotoSansBengali' },
      footer: () => ({
        columns: [
          { width: '50%', stack: [{ text: 'Seal & Signature', fontSize: 12, bold: true }, { text: 'Assistant to Registrar', fontSize: 9, margin: [0, 3, 0, 0] }] },
          { width: '50%', stack: [{ text: 'Seal & Signature', fontSize: 12, bold: true, alignment: 'right' }, { text: 'Registrar', fontSize: 9, alignment: 'right', margin: [0, 3, 0, 0] }] },
        ],
        margin: [40, 0, 40, 0],
      }),
      background: () => (watermarkDataUrl ? { image: watermarkDataUrl, width: 450, opacity: 0.1, absolutePosition: { x: 70, y: 150 } } : {}),
    };
  };

  const handleApprove = async (app) => {
    if (processingIds.has(app.id)) return;
    setProcessingIds(prev => new Set(prev).add(app.id));
    
    // 🟢 প্রোগ্রেস ট্র্যাকিং শুরু
    setDebugError('স্টেপ ১: QR ও বারকোড তৈরি হচ্ছে...');
    await new Promise(r => setTimeout(r, 800));

    try {
      let qrCodeUrl = null;
      let barcodeUrl = null;
      try {
        qrCodeUrl = await QRCode.toDataURL(`https://verify.com/${app.tracking_id}`, { width: 256, margin: 1 });
        const canvas = document.createElement('canvas');
        JsBarcode(canvas, app.tracking_id, { format: 'CODE128', displayValue: false, width: 2, height: 80, margin: 0 });
        barcodeUrl = canvas.toDataURL('image/png');
      } catch (e) {
        console.error('QR/Barcode failed', e);
      }

      setDebugError('স্টেপ ২: লোগো ও ওয়াটারমার্ক ডাউনলোড হচ্ছে...');
      await new Promise(r => setTimeout(r, 800));

      let logoDataUrl = null;
      let watermarkDataUrl = null;
      
      if (!LOGO_URL || LOGO_URL.includes('undefined')) {
        throw new Error(`লোগো URL সেট করা নেই! Vercel Env Var চেক করুন।`);
      }

      try { logoDataUrl = await getImageAsBase64('logo.png'); } 
      catch (e) { throw new Error(`লোগো ফাইল পাওয়া যায়নি: ` + e.message); }
      
      try { watermarkDataUrl = await getImageAsBase64('watermark.png'); } 
      catch (e) { console.warn(e.message); }

      setDebugError('স্টেপ ৩: PDF ফাইল তৈরি হচ্ছে (এতে ১০-১৫ সেকেন্ড লাগতে পারে)...');
      await new Promise(r => setTimeout(r, 800));
      
      const docDefinition = buildDocDefinition(app, qrCodeUrl, barcodeUrl, logoDataUrl, watermarkDataUrl);
      
      const pdfBlob = await new Promise((resolve, reject) => {
        try {
          pdfMake.createPdf(docDefinition).getBlob((blob) => resolve(blob));
        } catch (e) {
          reject(e);
        }
      });

      setDebugError('স্টেপ ৪: PDF Supabase Storage-এ আপলোড হচ্ছে...');

      const filePath = `certificates/${app.tracking_id}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('certificates')
        .upload(filePath, pdfBlob, { contentType: 'application/pdf', upsert: true });

      if (uploadError) throw new Error('আপলোড ব্যর্থ: ' + uploadError.message);

      setDebugError('স্টেপ ৫: ডাটাবেস আপডেট হচ্ছে...');
      const { data: publicUrlData } = supabase.storage.from('certificates').getPublicUrl(filePath);
      const pdfUrl = publicUrlData.publicUrl;

      const { error: updateError } = await supabase
        .from('birth_applications')
        .update({ status: 'Approved', pdf_url: pdfUrl })
        .eq('id', app.id);

      if (updateError) throw new Error('ডাটাবেস ব্যর্থ: ' + updateError.message);

      setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: 'Approved', pdf_url: pdfUrl } : a));
      setDebugError('সফলভাবে সার্টিফিকেট তৈরি হয়েছে!');
      
      setTimeout(() => setDebugError(null), 3000);

    } catch (err) {
      console.error("Approve Flow Error:", err);
      setDebugError('এরর: ' + (err?.message || err.toString()));
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(app.id);
        return next;
      });
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
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      window.open(app.pdf_url, '_blank');
    }
  };

  const handleAddLocation = async (e) => {
    e.preventDefault();
    if (!newLoc.division_name || !newLoc.district_name) {
      return setDebugError('বিভাগ ও জেলা অবশ্যই দিতে হবে।');
    }
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
    else {
      setAlertState({ isOpen: true, message: 'লোকেশন ডিলিট করা হয়েছে।', type: 'success' });
      fetchLocations();
    }
  };

  const handleOpenEdit = (loc) => { setEditLocData(loc); setIsEditModalOpen(true); };

  const handleUpdateLocation = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('locations').update({
        division_name: editLocData.division_name,
        division_en: editLocData.division_en,
        district_name: editLocData.district_name,
        district_en: editLocData.district_en,
        upazila_name: editLocData.upazila_name,
        upazila_en: editLocData.upazila_en,
        union_name: editLocData.union_name,
        union_en: editLocData.union_en,
      }).eq('id', editLocData.id);
      if (error) throw error;
      setAlertState({ isOpen: true, message: 'লোকেশন সফলভাবে আপডেট হয়েছে!', type: 'success' });
      setIsEditModalOpen(false);
      fetchLocations();
    } catch (err) {
      setDebugError('আপডেটে সমস্যা: ' + err.message);
    }
  };

  const filteredApps = applications.filter(app =>
    (app.tracking_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (app.first_name_bn || '').includes(searchQuery) ||
    (app.first_name_en || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalApps = applications.length;
  const pendingApps = applications.filter(a => a.status === 'Pending').length;
  const approvedApps = applications.filter(a => a.status === 'Approved').length;

  const inputClass = "w-full mt-1 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm text-gray-700 bg-gray-50 focus:bg-white";

  if (loading) return <div className="text-center mt-20 text-lg font-bold">লোড হচ্ছে...</div>;

  return (
    <div className="min-h-screen bg-gray-100 font-sans relative">
      
      {/* 🟢 স্ক্রিনের উপরে লাল রঙের স্পেশাল এরর বক্স */}
      {debugError && (
        <div className="fixed top-0 left-0 w-full bg-red-600 text-white p-4 z-[9999] shadow-xl flex justify-between items-start">
          <div className="flex flex-col">
            <span className="font-bold text-lg mb-1">⏳ প্রোগ্রেস / এরর:</span>
            <span className="text-sm break-all font-semibold">{debugError}</span>
          </div>
          <button onClick={() => setDebugError(null)} className="bg-red-800 hover:bg-red-900 text-white font-bold py-1 px-3 rounded ml-2 whitespace-nowrap">
            বন্ধ করুন
          </button>
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
                                  <>
                                    {app.pdf_url ? (
                                      <button onClick={() => handleDownload(app)} className="px-3 py-1 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-700 transition">Download</button>
                                    ) : (
                                      <button onClick={() => handleApprove(app)} disabled={busy} className={`px-3 py-1 text-white rounded text-xs font-bold transition ${busy ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                        {busy ? 'তৈরি হচ্ছে...' : 'Regenerate'}
                                      </button>
                                    )}
                                  </>
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
                    <div><label className="text-sm font-medium">বিভাগ (বাংলা) *</label><input value={newLoc.division_name} onChange={(e) => setNewLoc({ ...newLoc, division_name: e.target.value })} placeholder="যেমন: ঢাকা" className={inputClass} required /></div>
                    <div><label className="text-sm font-medium">Division (English) *</label><input value={newLoc.division_en} onChange={(e) => setNewLoc({ ...newLoc, division_en: e.target.value })} placeholder="e.g. Dhaka" className={inputClass} required /></div>
                    <div><label className="text-sm font-medium">জেলা (বাংলা) *</label><input value={newLoc.district_name} onChange={(e) => setNewLoc({ ...newLoc, district_name: e.target.value })} placeholder="যেমন: ঢাকা" className={inputClass} required /></div>
                    <div><label className="text-sm font-medium">District (English) *</label><input value={newLoc.district_en} onChange={(e) => setNewLoc({ ...newLoc, district_en: e.target.value })} placeholder="e.g. Dhaka" className={inputClass} required /></div>
                    <div><label className="text-sm font-medium">উপজেলা (বাংলা)</label><input value={newLoc.upazila_name} onChange={(e) => setNewLoc({ ...newLoc, upazila_name: e.target.value })} placeholder="যেমন: সাভার" className={inputClass} /></div>
                    <div><label className="text-sm font-medium">Upazila (English)</label><input value={newLoc.upazila_en} onChange={(e) => setNewLoc({ ...newLoc, upazila_en: e.target.value })} placeholder="e.g. Savar" className={inputClass} /></div>
                    <div><label className="text-sm font-medium">ইউনিয়ন/পৌরসভা (বাংলা)</label><input value={newLoc.union_name} onChange={(e) => setNewLoc({ ...newLoc, union_name: e.target.value })} placeholder="যেমন: সাভার পৌরসভা" className={inputClass} /></div>
                    <div><label className="text-sm font-medium">Union/Paurshava (English)</label><input value={newLoc.union_en} onChange={(e) => setNewLoc({ ...newLoc, union_en: e.target.value })} placeholder="e.g. Savar Paurashava" className={inputClass} /></div>
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
                              <button onClick={() => handleOpenEdit(loc)} className="text-blue-600 font-bold hover:underline transition">এডিট</button>
                              <button onClick={() => handleDeleteLocation(loc.id)} className="text-red-600 font-bold hover:underline transition">ডিলিট</button>
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
              {selectedApp.pdf_url && (
                <div className="text-right">
                  <a href={selectedApp.pdf_url} target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition inline-block">PDF দেখুন</a>
                </div>
              )}
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
    </div>
  );
}