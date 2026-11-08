import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import CustomAlert from '../components/CustomAlert';
import CustomSelect from '../components/CustomSelect'; // 🟢 কাস্টম সিলেক্ট ইমপোর্ট

const inputClass = "w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm text-gray-800 bg-gray-50 focus:bg-white shadow-sm";
const Req = () => <span className="text-red-500 ml-1">*</span>;

const AddressFields = ({ prefix, formData, handleChange, divisions, districts, upazilas, unions }) => {
  const currentDiv = formData[prefix].division;
  const currentDist = formData[prefix].district;
  const currentUpazila = formData[prefix].upazila;

  // ফিল্টার করা ডাটা
  const availableDistricts = currentDiv ? districts.filter(d => d.division_id.toString() === currentDiv) : [];
  const availableUpazilas = currentDist ? upazilas.filter(u => u.district_id.toString() === currentDist) : [];
  const availableUnions = currentUpazila ? unions.filter(un => un.upazila_id.toString() === currentUpazila) : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      <div>
        <label className="text-sm font-bold text-black">দেশ <Req /></label>
        <CustomSelect 
          name={`${prefix}.country`}
          options={[{ value: 'বাংলাদেশ', label: 'বাংলাদেশ' }]}
          value={formData[prefix].country}
          onChange={handleChange}
        />
      </div>
      
      <div>
        <label className="text-sm font-bold text-black">বিভাগ <Req /></label>
        <CustomSelect 
          name={`${prefix}.division`}
          options={divisions.map(d => ({ value: d.id.toString(), label: d.name_bn }))}
          value={formData[prefix].division}
          onChange={handleChange}
        />
      </div>

      <div>
        <label className="text-sm font-bold text-black">জেলা <Req /></label>
        <CustomSelect 
          name={`${prefix}.district`}
          options={availableDistricts.map(d => ({ value: d.id.toString(), label: d.name_bn }))}
          value={formData[prefix].district}
          onChange={handleChange}
          disabled={!currentDiv}
        />
      </div>

      <div>
        <label className="text-sm font-bold text-black">সিটি কর্পোরেশন, ক্যান্টনমেন্ট/উপজেলা <Req /></label>
        <CustomSelect 
          name={`${prefix}.upazila`}
          options={availableUpazilas.map(u => ({ value: u.id.toString(), label: u.name_bn }))}
          value={formData[prefix].upazila}
          onChange={handleChange}
          disabled={!currentDist}
        />
      </div>

      <div>
        <label className="text-sm font-bold text-black">পৌরসভা/ইউনিয়ন <Req /></label>
        <CustomSelect 
          name={`${prefix}.union`}
          options={availableUnions.map(u => ({ value: u.id.toString(), label: u.name_bn }))}
          value={formData[prefix].union}
          onChange={handleChange}
          disabled={!currentUpazila}
        />
      </div>

      <div>
        <label className="text-sm font-bold text-black">ওয়ার্ড <Req /></label>
        <CustomSelect 
          name={`${prefix}.ward`}
          options={[1,2,3,4,5,6,7,8,9].map(w => ({ value: w.toString(), label: w.toString() }))}
          value={formData[prefix].ward}
          onChange={handleChange}
        />
      </div>

      <div><label className="text-sm font-bold text-black">ডাকঘর (বাংলায়) <Req /></label><input name={`${prefix}.postOfficeBn`} value={formData[prefix].postOfficeBn} onChange={handleChange} className={inputClass} /></div>
      <div><label className="text-sm font-bold text-black">ডাকঘর (ইংরেজিতে) <Req /></label><input name={`${prefix}.postOfficeEn`} value={formData[prefix].postOfficeEn} onChange={handleChange} className={inputClass} /></div>
      <div><label className="text-sm font-bold text-black">গ্রাম/পাড়া/মহল্লা <Req /></label><input name={`${prefix}.villageBn`} value={formData[prefix].villageBn} onChange={handleChange} className={inputClass} /></div>
      <div><label className="text-sm font-bold text-black">গ্রাম/পাড়া/মহল্লা (ইংরেজি) <Req /></label><input name={`${prefix}.villageEn`} value={formData[prefix].villageEn} onChange={handleChange} className={inputClass} /></div>
      <div><label className="text-sm font-bold text-black">বাসা ও সড়ক (নাম, নম্বর)</label><input name={`${prefix}.houseRoadBn`} value={formData[prefix].houseRoadBn} onChange={handleChange} className={inputClass} /></div>
    </div>
  );
};

const defaultAddress = {
  country: 'বাংলাদেশ', division: '', district: '', upazila: '', union: '', ward: '', postOfficeBn: '', postOfficeEn: '', villageBn: '', villageEn: '', houseRoadBn: '', houseRoadEn: '',
};

export default function Apply() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // লোকেশন ডাটা
  const [divisions, setDivisions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [upazilas, setUpazilas] = useState([]);
  const [unions, setUnions] = useState([]);

  const [age, setAge] = useState(null);
  const [submittedTrackingId, setSubmittedTrackingId] = useState(null);
  const [alertState, setAlertState] = useState({ isOpen: false, message: '', type: 'success' });

  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) router.push('/login');
      else setUser(data.user);
    });

    const fetchLocations = async () => {
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
    fetchLocations();
  }, [router]);

  const [formData, setFormData] = useState({
    firstNameBn: '', lastNameBn: '', firstNameEn: '', lastNameEn: '', dob: '', childOrder: '', gender: '',
    birthAddress: { ...defaultAddress },
    fatherBrn: '', fatherDob: '', fatherNameBn: '', fatherNameEn: '', fatherNationality: 'বাংলাদেশী',
    motherBrn: '', motherDob: '', motherNameBn: '', motherNameEn: '', motherNationality: 'বাংলাদেশী',
    permanentSame: false,
    permanentAddress: { ...defaultAddress },
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

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => {
        const newData = { ...prev, [parent]: { ...prev[parent], [child]: val } };
        if (child === 'division') { newData[parent].district = ''; newData[parent].upazila = ''; newData[parent].union = ''; }
        if (child === 'district') { newData[parent].upazila = ''; newData[parent].union = ''; }
        if (child === 'upazila') { newData[parent].union = ''; }
        return newData;
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: val }));
    }
  };

  const validateStep = (s) => {
    if (s === 1) {
      if (!formData.firstNameBn || !formData.dob || !formData.birthAddress.division || !formData.birthAddress.district || !formData.birthAddress.upazila || !formData.birthAddress.union) {
        setAlertState({ isOpen: true, message: 'অনুগ্রহ করে নাম, জন্ম তারিখ, বিভাগ, জেলা, উপজেলা ও ইউনিয়ন পূরণ করুন।', type: 'error' });
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
    const birth = formData.birthAddress;
    const perm = formData.permanentSame ? formData.birthAddress : formData.permanentAddress;

    // লোকেশন আইডি থেকে নাম বের করা
    const selDiv = divisions.find(d => d.id.toString() === birth.division);
    const selDist = districts.find(d => d.id.toString() === birth.district);
    const selUpa = upazilas.find(u => u.id.toString() === birth.upazila);
    const selUni = unions.find(u => u.id.toString() === birth.union);

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
      division: selDiv?.name_bn || null,
      division_en: selDiv?.name_en || null,
      district: selDist?.name_bn || null,
      district_en: selDist?.name_en || null,
      city_corp: selUpa?.name_bn || null,
      upazila_en: selUpa?.name_en || null,
      union_name: selUni?.name_bn || null,
      union_en: selUni?.name_en || null,
      ward: birth.ward || null,
      village_bn: birth.villageBn || null,
      village_en: birth.villageEn || null,
      post_office_bn: birth.postOfficeBn || null,
      post_office_en: birth.postOfficeEn || null,
      house_road_bn: birth.houseRoadBn || null,
      house_road_en: birth.houseRoadEn || null,
      permanent_same: formData.permanentSame || false,
      permanent_division: perm.division || null,
      permanent_district: perm.district || null,
      permanent_village_bn: perm.villageBn || null,
      permanent_village_en: perm.villageEn || null,
      status: 'Pending'
    };

    try {
      const { error } = await supabase.from('birth_applications').insert([payload]);
      if (error) throw error;

      setSubmittedTrackingId(trackingId);
      setAlertState({ isOpen: true, message: `সফলভাবে আবেদন জমা হয়েছে!\n\nআপনার ট্র্যাকিং নম্বর: ${trackingId}\n\nএই নম্বরটি সংরক্ষণ করুন।`, type: 'success' });

    } catch (err) {
      setAlertState({ isOpen: true, message: 'সিস্টেম এরর: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (submittedTrackingId) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full text-center">
          <div className="text-green-500 text-6xl mb-4">✔</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">আবেদন সফল হয়েছে!</h2>
          <p className="text-gray-600 mb-6">আপনার ট্র্যাকিং নম্বর:</p>
          <div className="bg-gray-100 p-4 rounded-lg font-mono text-3xl font-bold text-green-700 tracking-widest mb-6">
            {submittedTrackingId}
          </div>
          <p className="text-xs text-gray-500 mb-6">এই নম্বরটি সংরক্ষণ করুন। এই নম্বর দিয়েই আপনি আপনার আবেদন ট্র্যাক করতে পারবেন।</p>
          <Link href="/dashboard" className="block w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition shadow">
            ড্যাশবোর্ডে যান
          </Link>
        </div>
        <CustomAlert isOpen={alertState.isOpen} message={alertState.message} type={alertState.type} onClose={() => setAlertState({ ...alertState, isOpen: false })} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 font-sans">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        
        <div className="bg-green-700 p-5 flex justify-between items-center text-white">
          <Link href="/dashboard" className="text-sm bg-green-800 px-4 py-2 rounded-lg hover:bg-green-900 transition">← ড্যাশবোর্ড</Link>
          <h2 className="text-xl font-bold">জন্ম নিবন্ধন আবেদন</h2>
          <div className="w-16"></div>
        </div>

        <div className="flex bg-gray-50 border-b">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`flex-1 text-center py-3 text-sm font-bold transition-colors ${step === s ? 'text-green-700 border-b-2 border-green-600 bg-white' : 'text-gray-400'}`}>
              {s === 1 ? '১. পরিচিতি' : s === 2 ? '২. পিতা-মাতা' : '৩. ঠিকানা ও সাবমিট'}
            </div>
          ))}
        </div>

        <div className="p-6 md:p-8">
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-black border-b pb-2">নিবন্ধনাধীন ব্যক্তির পরিচিতি</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div>
                  <label className="text-sm font-bold text-black">নামের প্রথম অংশ বাংলায় <Req /></label>
                  <input name="firstNameBn" value={formData.firstNameBn} onChange={handleChange} placeholder="নামের প্রথম অংশ বাংলায়" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-bold text-black">নামের শেষ অংশ বাংলায় <Req /></label>
                  <input name="lastNameBn" value={formData.lastNameBn} onChange={handleChange} placeholder="নামের শেষ অংশ বাংলায়" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-bold text-black">নামের প্রথম অংশ ইংরেজিতে <Req /></label>
                  <input name="firstNameEn" value={formData.firstNameEn} onChange={handleChange} placeholder="First Name in English" className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-bold text-black">নামের শেষ অংশ ইংরেজিতে <Req /></label>
                  <input name="lastNameEn" value={formData.lastNameEn} onChange={handleChange} placeholder="Last Name in English" className={inputClass} />
                </div>
                
                <div>
                  <label className="text-sm font-bold text-black">জন্ম তারিখ (খ্রিঃ) <Req /></label>
                  <input type="date" name="dob" value={formData.dob} onChange={handleChange} className={inputClass} />
                  {age && <p className="text-xs text-green-600 font-bold mt-1">বয়স: {age.years} বছর, {age.months} মাস, {age.days} দিন</p>}
                </div>

                <div>
                  <label className="text-sm font-bold text-black">পিতা ও মাতার কততম সন্তান <Req /></label>
                  <CustomSelect 
                    name="childOrder"
                    options={[1,2,3,4,5,6,7,8,9,10].map(n => ({ value: n.toString(), label: n.toString() }))}
                    value={formData.childOrder}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-black">লিঙ্গ <Req /></label>
                  <CustomSelect 
                    name="gender"
                    options={[
                      { value: 'পুরুষ', label: 'পুরুষ' },
                      { value: 'মহিলা', label: 'মহিলা' },
                      { value: 'হিজড়া', label: 'হিজড়া' }
                    ]}
                    value={formData.gender}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <h3 className="text-lg font-bold text-black border-b pb-2 mt-8">জন্মস্থানের ঠিকানা</h3>
              <AddressFields prefix="birthAddress" formData={formData} handleChange={handleChange} divisions={divisions} districts={districts} upazilas={upazilas} unions={unions} />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-black border-b pb-2">পিতার তথ্য</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-sm font-bold text-black">পিতার জন্ম নিবন্ধন নম্বর <Req /></label><input name="fatherBrn" value={formData.fatherBrn} onChange={handleChange} placeholder="জন্ম নিবন্ধন নম্বর" className={inputClass} /></div>
                <div><label className="text-sm font-bold text-black">জন্ম তারিখ (খ্রিঃ) <Req /></label><input type="date" name="fatherDob" value={formData.fatherDob} onChange={handleChange} className={inputClass} /></div>
                <div><label className="text-sm font-bold text-black">পিতার নাম বাংলায় <Req /></label><input name="fatherNameBn" value={formData.fatherNameBn} onChange={handleChange} placeholder="পিতার নাম বাংলায়" className={inputClass} /></div>
                <div><label className="text-sm font-bold text-black">পিতার নাম ইংরেজিতে <Req /></label><input name="fatherNameEn" value={formData.fatherNameEn} onChange={handleChange} placeholder="Father's Name in English" className={inputClass} /></div>
                <div>
                  <label className="text-sm font-bold text-black">পিতার জাতীয়তা <Req /></label>
                  <CustomSelect 
                    name="fatherNationality"
                    options={[{ value: 'বাংলাদেশী', label: 'বাংলাদেশী' }, { value: 'অন্যান্য', label: 'অন্যান্য' }]}
                    value={formData.fatherNationality}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <h3 className="text-lg font-bold text-black border-b pb-2 mt-8">মাতার তথ্য</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-sm font-bold text-black">মাতার জন্ম নিবন্ধন নম্বর <Req /></label><input name="motherBrn" value={formData.motherBrn} onChange={handleChange} placeholder="জন্ম নিবন্ধন নম্বর" className={inputClass} /></div>
                <div><label className="text-sm font-bold text-black">জন্ম তারিখ (খ্রিঃ) <Req /></label><input type="date" name="motherDob" value={formData.motherDob} onChange={handleChange} className={inputClass} /></div>
                <div><label className="text-sm font-bold text-black">মাতার নাম বাংলায় <Req /></label><input name="motherNameBn" value={formData.motherNameBn} onChange={handleChange} placeholder="মাতার নাম বাংলায়" className={inputClass} /></div>
                <div><label className="text-sm font-bold text-black">মাতার নাম ইংরেজিতে <Req /></label><input name="motherNameEn" value={formData.motherNameEn} onChange={handleChange} placeholder="Mother's Name in English" className={inputClass} /></div>
                <div>
                  <label className="text-sm font-bold text-black">মাতার জাতীয়তা <Req /></label>
                  <CustomSelect 
                    name="motherNationality"
                    options={[{ value: 'বাংলাদেশী', label: 'বাংলাদেশী' }, { value: 'অন্যান্য', label: 'অন্যান্য' }]}
                    value={formData.motherNationality}
                    onChange={handleChange}
                  />
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
                <>
                  <h3 className="text-lg font-bold text-black border-b pb-2 mt-6">স্থায়ী ঠিকানা</h3>
                  <AddressFields prefix="permanentAddress" formData={formData} handleChange={handleChange} divisions={divisions} districts={districts} upazilas={upazilas} unions={unions} />
                </>
              )}
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t flex justify-between">
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)} className="px-6 py-2.5 bg-gray-400 text-white font-bold rounded-lg hover:bg-gray-500 transition shadow">← পূর্ববর্তী</button>
          ) : <div></div>}

          {step < 3 ? (
            <button onClick={handleNext} className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition shadow">পরবর্তী →</button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md transition disabled:bg-gray-400">
              {loading ? 'সাবমিট হচ্ছে...' : 'চূড়ান্ত সাবমিট করুন'}
            </button>
          )}
        </div>
      </div>

      <CustomAlert isOpen={alertState.isOpen} message={alertState.message} type={alertState.type} onClose={() => setAlertState({ ...alertState, isOpen: false })} />
    </div>
  );
}