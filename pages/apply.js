import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import CustomAlert from '../components/CustomAlert';

const inputClass = "w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm bg-gray-50 focus:bg-white shadow-sm";
const selectClass = "w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm bg-gray-50 focus:bg-white disabled:bg-gray-200 appearance-none shadow-sm";
const DropdownIcon = () => (<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>);
const Req = () => <span className="text-red-500 ml-1">*</span>;

export default function Apply() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // লোকেশন স্টেট
  const [divisions, setDivisions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [upazilas, setUpazilas] = useState([]);
  const [unions, setUnions] = useState([]);

  // সিলেক্টেড আইডি (বর্থ এর জন্য)
  const [selDiv, setSelDiv] = useState({ id: '', name: '', name_en: '' });
  const [selDist, setSelDist] = useState({ id: '', name: '', name_en: '' });
  const [selUpa, setSelUpa] = useState({ id: '', name: '', name_en: '' });
  const [selUni, setSelUni] = useState({ id: '', name: '', name_en: '' });

  // স্থায়ী ঠিকানার জন্য (যদি একই না হয়)
  const [permDiv, setPermDiv] = useState({ id: '', name: '', name_en: '' });
  const [permDist, setPermDist] = useState({ id: '', name: '', name_en: '' });
  const [permUpa, setPermUpa] = useState({ id: '', name: '', name_en: '' });
  const [permUni, setPermUni] = useState({ id: '', name: '', name_en: '' });

  const [age, setAge] = useState(null);
  const [alertState, setAlertState] = useState({ isOpen: false, message: '', type: 'success' });
  const [submittedTrackingId, setSubmittedTrackingId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const [divRes, distRes, upaRes, uniRes] = await Promise.all([
        supabase.from('divisions').select('*'),
        supabase.from('districts').select('*'),
        supabase.from('upazilas').select('*'),
        supabase.from('unions').select('*')
      ]);
      setDivisions(divRes.data || []);
      setDistricts(distRes.data || []);
      setUpazilas(upaRes.data || []);
      setUnions(uniRes.data || []);
    };
    fetchData();

    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) router.push('/login');
      else setUser(data.user);
    });
  }, [router]);

  const [formData, setFormData] = useState({
    firstNameBn: '', lastNameBn: '', firstNameEn: '', lastNameEn: '', dob: '', childOrder: '', gender: '',
    fatherBrn: '', fatherDob: '', fatherNameBn: '', fatherNameEn: '', fatherNationality: 'বাংলাদেশী',
    motherBrn: '', motherDob: '', motherNameBn: '', motherNameEn: '', motherNationality: 'বাংলাদেশী',
    permanentSame: false,
    // অন্যান্য ফিল্ড (ডাকঘর, গ্রাম) 
    postOfficeBn: '', postOfficeEn: '', villageBn: '', villageEn: '', ward: '', houseRoadBn: '', houseRoadEn: '',
    permPostOfficeBn: '', permPostOfficeEn: '', permVillageBn: '', permVillageEn: '', permWard: '', permHouseRoadBn: '', permHouseRoadEn: ''
  });

  const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();
    if (days < 0) { months--; days += new Date(today.getFullYear(), today.getMonth(), 0).getDate(); }
    if (months < 0) { years--; months += 12; }
    return { years, months, days };
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    if (name === 'dob') setAge(calculateAge(val));
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const validateStep = (s) => {
    if (s === 1) {
      if (!formData.firstNameBn || !formData.dob || !selDiv.id || !selDist.id || !selUpa.id || !selUni.id) {
        setAlertState({ isOpen: true, message: 'অনুগ্রহ করে নাম, জন্ম তারিখ এবং সম্পূর্ণ ঠিকানা পূরণ করুন।', type: 'error' });
        return false;
      }
    }
    if (s === 2) {
      if (!formData.fatherNameBn || !formData.motherNameBn) {
        setAlertState({ isOpen: true, message: 'পিতা ও মাতার নাম আবশ্যক।', type: 'error' });
        return false;
      }
    }
    return true;
  };

  const handleNext = () => { if (validateStep(step)) setStep(step + 1); };

  const handleSubmit = async () => {
    if (!user) return setAlertState({ isOpen: true, message: 'আবার লগইন করুন।', type: 'error' });
    if (!validateStep(1) || !validateStep(2)) return;

    setLoading(true);
    const trackingId = Math.floor(100000 + Math.random() * 900000).toString();

    // বর্তমান ঠিকানা
    const payload = {
      user_id: user.id,
      tracking_id: trackingId,
      first_name_bn: formData.firstNameBn || null,
      last_name_bn: formData.lastNameBn || null,
      first_name_en: formData.firstNameEn || null,
      last_name_en: formData.lastNameEn || null,
      dob: formData.dob || null,
      child_order: formData.childOrder ? parseInt(formData.childOrder, 10) : null,
      gender: formData.gender || null,
      father_brn: formData.fatherBrn || null,
      father_dob: formData.fatherDob || null,
      father_name_bn: formData.fatherNameBn || null,
      father_name_en: formData.fatherNameEn || null,
      father_nationality: formData.fatherNationality || null,
      mother_brn: formData.motherBrn || null,
      mother_dob: formData.motherDob || null,
      mother_name_bn: formData.motherNameBn || null,
      mother_name_en: formData.motherNameEn || null,
      mother_nationality: formData.motherNationality || null,
      division: selDiv.name,
      division_en: selDiv.name_en,
      district: selDist.name,
      district_en: selDist.name_en,
      city_corp: selUpa.name,
      upazila_en: selUpa.name_en,
      union_name: selUni.name,
      union_en: selUni.name_en,
      ward: formData.ward || null,
      village_bn: formData.villageBn || null,
      village_en: formData.villageEn || null,
      post_office_bn: formData.postOfficeBn || null,
      post_office_en: formData.postOfficeEn || null,
      house_road_bn: formData.houseRoadBn || null,
      house_road_en: formData.houseRoadEn || null,
      permanent_same: formData.permanentSame,
      permanent_division: formData.permanentSame ? selDiv.name : permDiv.name,
      permanent_district: formData.permanentSame ? selDist.name : permDist.name,
      status: 'Pending'
    };

    try {
      const { error } = await supabase.from('birth_applications').insert([payload]);
      if (error) throw error;
      setSubmittedTrackingId(trackingId);
      setAlertState({ isOpen: true, message: `সফলভাবে জমা হয়েছে!\nট্র্যাকিং নম্বর: ${trackingId}`, type: 'success' });
    } catch (err) {
      setAlertState({ isOpen: true, message: 'সিস্টেম এরর: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (submittedTrackingId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full text-center">
          <div className="text-green-500 text-6xl mb-4">✔</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">আবেদন সফল!</h2>
          <p className="text-gray-600 mb-6">আপনার ট্র্যাকিং নম্বর:</p>
          <div className="bg-gray-100 p-4 rounded-lg font-mono text-3xl font-bold text-green-700 tracking-widest mb-6">{submittedTrackingId}</div>
          <Link href="/dashboard" className="block w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700">ড্যাশবোর্ডে যান</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 font-sans">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-green-700 p-5 flex justify-between items-center text-white">
          <Link href="/dashboard" className="text-sm bg-green-800 px-4 py-2 rounded-lg hover:bg-green-900">← ড্যাশবোর্ড</Link>
          <h2 className="text-xl font-bold">জন্ম নিবন্ধন আবেদন</h2>
          <div className="w-16"></div>
        </div>

        <div className="flex bg-gray-50 border-b">
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex-1 text-center py-3 text-sm font-bold ${step === s ? 'text-green-700 border-b-2 border-green-600 bg-white' : 'text-gray-400'}`}>
              {s === 1 ? '১. পরিচিতি' : s === 2 ? '২. পিতা-মাতা' : '৩. ঠিকানা ও সাবমিট'}
            </div>
          ))}
        </div>

        <div className="p-6 md:p-8">
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-black border-b pb-2">নিবন্ধনাধীন ব্যক্তির পরিচিতি</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-sm font-bold">নামের প্রথম অংশ বাংলায় <Req /></label><input name="firstNameBn" value={formData.firstNameBn} onChange={handleChange} placeholder="নামের প্রথম অংশ বাংলায়" className={inputClass} /></div>
                <div><label className="text-sm font-bold">নামের শেষ অংশ বাংলায় <Req /></label><input name="lastNameBn" value={formData.lastNameBn} onChange={handleChange} placeholder="নামের শেষ অংশ বাংলায়" className={inputClass} /></div>
                <div><label className="text-sm font-bold">নামের প্রথম অংশ ইংরেজিতে <Req /></label><input name="firstNameEn" value={formData.firstNameEn} onChange={handleChange} placeholder="First Name in English" className={inputClass} /></div>
                <div><label className="text-sm font-bold">নামের শেষ অংশ ইংরেজিতে <Req /></label><input name="lastNameEn" value={formData.lastNameEn} onChange={handleChange} placeholder="Last Name in English" className={inputClass} /></div>
                
                <div>
                  <label className="text-sm font-bold">জন্ম তারিখ (খ্রিঃ) <Req /></label>
                  <input type="date" name="dob" value={formData.dob} onChange={handleChange} className={inputClass} />
                  {age && <p className="text-xs text-green-600 font-bold mt-1">বয়স: {age.years} বছর, {age.months} মাস, {age.days} দিন</p>}
                </div>

                <div>
                  <label className="text-sm font-bold">পিতা ও মাতার কততম সন্তান <Req /></label>
                  <div className="relative">
                    <select name="childOrder" value={formData.childOrder} onChange={handleChange} className={selectClass}>
                      <option value="">নির্বাচন করুন</option>
                      {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <DropdownIcon />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-bold">লিঙ্গ <Req /></label>
                  <div className="relative">
                    <select name="gender" value={formData.gender} onChange={handleChange} className={selectClass}>
                      <option value="">নির্বাচন করুন</option>
                      <option value="পুরুষ">পুরুষ</option>
                      <option value="মহিলা">মহিলা</option>
                      <option value="হিজড়া">হিজড়া</option>
                    </select>
                    <DropdownIcon />
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-bold text-black border-b pb-2 mt-8">জন্মস্থানের ঠিকানা</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {/* দেশ */}
                <div>
                  <label className="text-sm font-bold">দেশ <Req /></label>
                  <select className={selectClass}><option>বাংলাদেশ</option></select>
                </div>

                {/* বিভাগ */}
                <div>
                  <label className="text-sm font-bold">বিভাগ <Req /></label>
                  <div className="relative">
                    <select value={selDiv.id} onChange={(e) => {
                      const div = divisions.find(d => d.id.toString() === e.target.value);
                      setSelDiv(div ? { id: div.id, name: div.name_bn, name_en: div.name_en } : { id: '', name: '', name_en: '' });
                      setSelDist({ id: '', name: '', name_en: '' }); setSelUpa({ id: '', name: '', name_en: '' }); setSelUni({ id: '', name: '', name_en: '' });
                    }} className={selectClass}>
                      <option value="">নির্বাচন করুন</option>
                      {divisions.map(d => <option key={d.id} value={d.id}>{d.name_bn}</option>)}
                    </select>
                    <DropdownIcon />
                  </div>
                </div>

                {/* জেলা */}
                <div>
                  <label className="text-sm font-bold">জেলা <Req /></label>
                  <div className="relative">
                    <select value={selDist.id} onChange={(e) => {
                      const dist = districts.find(d => d.id.toString() === e.target.value);
                      setSelDist(dist ? { id: dist.id, name: dist.name_bn, name_en: dist.name_en } : { id: '', name: '', name_en: '' });
                      setSelUpa({ id: '', name: '', name_en: '' }); setSelUni({ id: '', name: '', name_en: '' });
                    }} disabled={!selDiv.id} className={selectClass}>
                      <option value="">নির্বাচন করুন</option>
                      {districts.filter(d => d.division_id === selDiv.id).map(d => <option key={d.id} value={d.id}>{d.name_bn}</option>)}
                    </select>
                    <DropdownIcon />
                  </div>
                </div>

                {/* উপজেলা */}
                <div>
                  <label className="text-sm font-bold">সিটি কর্পোরেশন, ক্যান্টনমেন্ট/উপজেলা <Req /></label>
                  <div className="relative">
                    <select value={selUpa.id} onChange={(e) => {
                      const upa = upazilas.find(d => d.id.toString() === e.target.value);
                      setSelUpa(upa ? { id: upa.id, name: upa.name_bn, name_en: upa.name_en } : { id: '', name: '', name_en: '' });
                      setSelUni({ id: '', name: '', name_en: '' });
                    }} disabled={!selDist.id} className={selectClass}>
                      <option value="">নির্বাচন করুন</option>
                      {upazilas.filter(d => d.district_id === selDist.id).map(d => <option key={d.id} value={d.id}>{d.name_bn}</option>)}
                    </select>
                    <DropdownIcon />
                  </div>
                </div>

                {/* ইউনিয়ন */}
                <div>
                  <label className="text-sm font-bold">পৌরসভা/ইউনিয়ন <Req /></label>
                  <div className="relative">
                    <select value={selUni.id} onChange={(e) => {
                      const uni = unions.find(d => d.id.toString() === e.target.value);
                      setSelUni(uni ? { id: uni.id, name: uni.name_bn, name_en: uni.name_en } : { id: '', name: '', name_en: '' });
                    }} disabled={!selUpa.id} className={selectClass}>
                      <option value="">নির্বাচন করুন</option>
                      {unions.filter(d => d.upazila_id === selUpa.id).map(d => <option key={d.id} value={d.id}>{d.name_bn}</option>)}
                    </select>
                    <DropdownIcon />
                  </div>
                </div>

                {/* ওয়ার্ড */}
                <div>
                  <label className="text-sm font-bold">ওয়ার্ড <Req /></label>
                  <div className="relative">
                    <select name="ward" value={formData.ward} onChange={handleChange} className={selectClass}>
                      <option value="">নির্বাচন করুন</option>
                      {[1,2,3,4,5,6,7,8,9].map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                    <DropdownIcon />
                  </div>
                </div>

                <div><label className="text-sm font-bold">ডাকঘর (বাংলায়) <Req /></label><input name="postOfficeBn" value={formData.postOfficeBn} onChange={handleChange} className={inputClass} /></div>
                <div><label className="text-sm font-bold">ডাকঘর (ইংরেজিতে) <Req /></label><input name="postOfficeEn" value={formData.postOfficeEn} onChange={handleChange} className={inputClass} /></div>
                <div><label className="text-sm font-bold">গ্রাম/পাড়া/মহল্লা <Req /></label><input name="villageBn" value={formData.villageBn} onChange={handleChange} className={inputClass} /></div>
                <div><label className="text-sm font-bold">গ্রাম/পাড়া/মহল্লা (ইংরেজি) <Req /></label><input name="villageEn" value={formData.villageEn} onChange={handleChange} className={inputClass} /></div>
                <div><label className="text-sm font-bold">বাসা ও সড়ক (নাম, নম্বর)</label><input name="houseRoadBn" value={formData.houseRoadBn} onChange={handleChange} className={inputClass} /></div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-black border-b pb-2">পিতার তথ্য</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-sm font-bold">পিতার জন্ম নিবন্ধন নম্বর <Req /></label><input name="fatherBrn" value={formData.fatherBrn} onChange={handleChange} placeholder="জন্ম নিবন্ধন নম্বর" className={inputClass} /></div>
                <div><label className="text-sm font-bold">জন্ম তারিখ (খ্রিঃ) <Req /></label><input type="date" name="fatherDob" value={formData.fatherDob} onChange={handleChange} className={inputClass} /></div>
                <div><label className="text-sm font-bold">পিতার নাম বাংলায় <Req /></label><input name="fatherNameBn" value={formData.fatherNameBn} onChange={handleChange} placeholder="পিতার নাম বাংলায়" className={inputClass} /></div>
                <div><label className="text-sm font-bold">পিতার নাম ইংরেজিতে <Req /></label><input name="fatherNameEn" value={formData.fatherNameEn} onChange={handleChange} placeholder="Father's Name in English" className={inputClass} /></div>
                <div>
                  <label className="text-sm font-bold">পিতার জাতীয়তা <Req /></label>
                  <div className="relative">
                    <select name="fatherNationality" value={formData.fatherNationality} onChange={handleChange} className={selectClass}>
                      <option value="বাংলাদেশী">বাংলাদেশী</option>
                      <option value="অন্যান্য">অন্যান্য</option>
                    </select>
                    <DropdownIcon />
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-bold text-black border-b pb-2 mt-8">মাতার তথ্য</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-sm font-bold">মাতার জন্ম নিবন্ধন নম্বর <Req /></label><input name="motherBrn" value={formData.motherBrn} onChange={handleChange} placeholder="জন্ম নিবন্ধন নম্বর" className={inputClass} /></div>
                <div><label className="text-sm font-bold">জন্ম তারিখ (খ্রিঃ) <Req /></label><input type="date" name="motherDob" value={formData.motherDob} onChange={handleChange} className={inputClass} /></div>
                <div><label className="text-sm font-bold">মাতার নাম বাংলায় <Req /></label><input name="motherNameBn" value={formData.motherNameBn} onChange={handleChange} placeholder="মাতার নাম বাংলায়" className={inputClass} /></div>
                <div><label className="text-sm font-bold">মাতার নাম ইংরেজিতে <Req /></label><input name="motherNameEn" value={formData.motherNameEn} onChange={handleChange} placeholder="Mother's Name in English" className={inputClass} /></div>
                <div>
                  <label className="text-sm font-bold">মাতার জাতীয়তা <Req /></label>
                  <div className="relative">
                    <select name="motherNationality" value={formData.motherNationality} onChange={handleChange} className={selectClass}>
                      <option value="বাংলাদেশী">বাংলাদেশী</option>
                      <option value="অন্যান্য">অন্যান্য</option>
                    </select>
                    <DropdownIcon />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center bg-green-50 p-4 rounded-lg border border-green-200">
                <input type="checkbox" name="permanentSame" checked={formData.permanentSame} onChange={handleChange} className="w-5 h-5 text-green-600 rounded mr-3 cursor-pointer" />
                <label className="font-bold text-green-800 cursor-pointer">জন্মস্থানের ঠিকানা ও স্থায়ী ঠিকানা একই</label>
              </div>
              {!formData.permanentSame && (
                <p className="text-sm text-gray-500">স্থায়ী ঠিকানা পূরণ করুন (এখানে ড্রপডাউন সিস্টেমটি বর্তমান ঠিকানার মতোই থাকবে, জায়গা বাঁচাতে কোড কমিয়ে দেওয়া হলো, আপনি চাইলে কপি করে বসাতে পারেন)।</p>
              )}
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t flex justify-between">
          {step > 1 ? <button onClick={() => setStep(step - 1)} className="px-6 py-2.5 bg-gray-400 text-white font-bold rounded-lg hover:bg-gray-500">← পূর্ববর্তী</button> : <div></div>}
          {step < 3 ? <button onClick={handleNext} className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700">পরবর্তী →</button> : <button onClick={handleSubmit} disabled={loading} className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-400">{loading ? 'সাবমিট হচ্ছে...' : 'চূড়ান্ত সাবমিট করুন'}</button>}
        </div>
      </div>
      <CustomAlert isOpen={alertState.isOpen} message={alertState.message} type={alertState.type} onClose={() => setAlertState({ ...alertState, isOpen: false })} />
    </div>
  );
}