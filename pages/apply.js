import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { generateBRN, checkTrackingIdExists } from '../lib/generateBRN';
import CustomAlert from '../components/CustomAlert';

const inputClass = "w-full mt-1 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm text-gray-700 bg-gray-50 focus:bg-white";
const selectClass = "w-full mt-1 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm text-gray-700 bg-gray-50 focus:bg-white disabled:bg-gray-200 appearance-none cursor-pointer";

const AddressFields = ({ prefix, formData, handleChange, locations }) => {
  const currentDiv = formData[prefix].division;
  const currentDist = formData[prefix].district;
  const currentUpazila = formData[prefix].upazila;

  const availableDivisions = [...new Set(locations.map(loc => loc.division_name))];
  const availableDistricts = currentDiv ? [...new Set(locations.filter(loc => loc.division_name === currentDiv).map(loc => loc.district_name))] : [];
  const availableUpazilas = (currentDiv && currentDist) ? [...new Set(locations.filter(loc => loc.division_name === currentDiv && loc.district_name === currentDist).map(loc => loc.upazila_name))] : [];
  const availableUnions = (currentDiv && currentDist && currentUpazila) ? locations.filter(loc => loc.division_name === currentDiv && loc.district_name === currentDist && loc.upazila_name === currentUpazila).map(loc => loc.union_name) : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      <div><label className="text-sm font-semibold text-gray-700">দেশ</label><input name={`${prefix}.country`} value={formData[prefix].country} onChange={handleChange} className={`${inputClass} bg-gray-200 cursor-not-allowed`} readOnly /></div>

      <div>
        <label className="text-sm font-semibold text-gray-700">বিভাগ *</label>
        <select name={`${prefix}.division`} value={formData[prefix].division} onChange={handleChange} className={selectClass}>
          <option value="">-- নির্বাচন করুন --</option>
          {availableDivisions.map(div => <option key={div} value={div}>{div}</option>)}
        </select>
      </div>

      <div>
        <label className="text-sm font-semibold text-gray-700">জেলা *</label>
        <select name={`${prefix}.district`} value={formData[prefix].district} onChange={handleChange} disabled={!currentDiv} className={selectClass}>
          <option value="">-- নির্বাচন করুন --</option>
          {availableDistricts.map(dist => <option key={dist} value={dist}>{dist}</option>)}
        </select>
      </div>

      <div>
        <label className="text-sm font-semibold text-gray-700">উপজেলা/থানা *</label>
        <select name={`${prefix}.upazila`} value={formData[prefix].upazila} onChange={handleChange} disabled={!currentDist} className={selectClass}>
          <option value="">-- নির্বাচন করুন --</option>
          {availableUpazilas.map(up => <option key={up} value={up}>{up}</option>)}
        </select>
      </div>

      <div>
        <label className="text-sm font-semibold text-gray-700">এলাকার ধরন</label>
        <select name={`${prefix}.areaType`} value={formData[prefix].areaType} onChange={handleChange} className={selectClass}>
          <option value="ইউনিয়ন পরিষদ">ইউনিয়ন পরিষদ</option>
          <option value="পৌরসভা">পৌরসভা</option>
          <option value="সিটি কর্পোরেশন">সিটি কর্পোরেশন</option>
          <option value="ক্যান্টনমেন্ট বোর্ড">ক্যান্টনমেন্ট বোর্ড</option>
        </select>
      </div>

      <div>
        <label className="text-sm font-semibold text-gray-700">ইউনিয়ন/পৌরসভা *</label>
        <select name={`${prefix}.union`} value={formData[prefix].union} onChange={handleChange} disabled={!currentUpazila} className={selectClass}>
          <option value="">-- নির্বাচন করুন --</option>
          {availableUnions.map(un => <option key={un} value={un}>{un}</option>)}
        </select>
      </div>

      <div><label className="text-sm font-semibold text-gray-700">ওয়ার্ড নং</label><input name={`${prefix}.ward`} value={formData[prefix].ward} onChange={handleChange} className={inputClass} /></div>
      <div><label className="text-sm font-semibold text-gray-700">গ্রাম/পাড়া/মহল্লা (বাংলা)</label><input name={`${prefix}.villageBn`} value={formData[prefix].villageBn} onChange={handleChange} className={inputClass} /></div>
      <div><label className="text-sm font-semibold text-gray-700">গ্রাম/পাড়া/মহল্লা (ইংরেজি)</label><input name={`${prefix}.villageEn`} value={formData[prefix].villageEn} onChange={handleChange} className={inputClass} /></div>
      <div><label className="text-sm font-semibold text-gray-700">ডাকঘর (বাংলা)</label><input name={`${prefix}.postOfficeBn`} value={formData[prefix].postOfficeBn} onChange={handleChange} className={inputClass} /></div>
      <div><label className="text-sm font-semibold text-gray-700">ডাকঘর (ইংরেজি)</label><input name={`${prefix}.postOfficeEn`} value={formData[prefix].postOfficeEn} onChange={handleChange} className={inputClass} /></div>
      <div><label className="text-sm font-semibold text-gray-700">বাসা ও সড়ক (বাংলা)</label><input name={`${prefix}.houseRoadBn`} value={formData[prefix].houseRoadBn} onChange={handleChange} className={inputClass} /></div>
      <div><label className="text-sm font-semibold text-gray-700">বাসা ও সড়ক (ইংরেজি)</label><input name={`${prefix}.houseRoadEn`} value={formData[prefix].houseRoadEn} onChange={handleChange} className={inputClass} /></div>
    </div>
  );
};

const defaultAddress = {
  country: 'বাংলাদেশ',
  division: '',
  district: '',
  areaType: 'ইউনিয়ন পরিষদ',
  upazila: '',
  union: '',
  ward: '',
  postOfficeBn: '',
  postOfficeEn: '',
  villageBn: '',
  villageEn: '',
  houseRoadBn: '',
  houseRoadEn: '',
};

export default function Apply() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [submittedBrn, setSubmittedBrn] = useState(null);

  const [alertState, setAlertState] = useState({ isOpen: false, message: '', type: 'success' });

  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) {
        router.push('/login');
      } else {
        setUser(data.user);
      }
    });

    const fetchLocations = async () => {
      const { data, error } = await supabase.from('locations').select('*');
      if (error) console.error("Locations Fetch Error:", error);
      else setLocations(data || []);
    };
    fetchLocations();
  }, [router]);

  const [formData, setFormData] = useState({
    firstNameBn: '', lastNameBn: '', firstNameEn: '', lastNameEn: '',
    dob: '', childOrder: '', gender: '',
    birthAddress: { ...defaultAddress },
    fatherBrn: '', fatherDob: '', fatherNameBn: '', fatherNameEn: '', fatherNationality: 'বাংলাদেশী',
    motherBrn: '', motherDob: '', motherNameBn: '', motherNameEn: '', motherNationality: 'বাংলাদেশী',
    permanentSame: false,
    permanentAddress: { ...defaultAddress },
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;

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

  const handleNext = () => {
    if (validateStep(step)) setStep(step + 1);
  };

  const handleSubmit = async () => {
    if (!user) {
      setAlertState({ isOpen: true, message: 'আপনি লগইন করা নেই। আবার লগইন করুন।', type: 'error' });
      return;
    }
    if (!validateStep(1) || !validateStep(2)) return;
    if (!formData.permanentSame) {
      const p = formData.permanentAddress;
      if (!p.division || !p.district || !p.upazila || !p.union) {
        setAlertState({ isOpen: true, message: 'স্থায়ী ঠিকানার বিভাগ, জেলা, উপজেলা ও ইউনিয়ন পূরণ করুন।', type: 'error' });
        return;
      }
    }

    setLoading(true);

    const birth = formData.birthAddress;
    const perm = formData.permanentSame ? formData.birthAddress : formData.permanentAddress;

    const matchedLoc = locations.find(loc =>
      loc.division_name === birth.division &&
      loc.district_name === birth.district &&
      loc.upazila_name === birth.upazila &&
      loc.union_name === birth.union
    );

    // Retry loop for unique tracking id
    let brnNumber = generateBRN(formData);
    let duplicateChecked = 0;
    while (duplicateChecked < 5) {
      const { exists } = await checkTrackingIdExists(supabase, brnNumber);
      if (!exists) break;
      brnNumber = generateBRN(formData, 0, duplicateChecked + 1);
      duplicateChecked++;
    }

    const payload = {
      user_id: user.id,
      tracking_id: brnNumber,
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
      division: birth.division || null,
      district: birth.district || null,
      city_corp: birth.upazila || null,
      union_name: birth.union || null,
      ward: birth.ward || null,
      village_bn: birth.villageBn || null,
      village_en: birth.villageEn || null,
      post_office_bn: birth.postOfficeBn || null,
      post_office_en: birth.postOfficeEn || null,
      house_road_bn: birth.houseRoadBn || null,
      house_road_en: birth.houseRoadEn || null,
      division_en: matchedLoc?.division_en || birth.division || null,
      district_en: matchedLoc?.district_en || birth.district || null,
      upazila_en: matchedLoc?.upazila_en || birth.upazila || null,
      union_en: matchedLoc?.union_en || birth.union || null,
      permanent_same: formData.permanentSame || false,
      permanent_division: perm.division || null,
      permanent_district: perm.district || null,
      permanent_village_bn: perm.villageBn || null,
      permanent_village_en: perm.villageEn || null,
      status: 'Pending',
    };

    try {
      const { error } = await supabase.from('birth_applications').insert([payload]);

      if (error) {
        setAlertState({
          isOpen: true,
          message: `এরর: ${error.message}${error.details ? `\nDetails: ${error.details}` : ''}${error.hint ? `\nHint: ${error.hint}` : ''}`,
          type: 'error',
        });
      } else {
        setSubmittedBrn(brnNumber);
        setAlertState({
          isOpen: true,
          message: `সফলভাবে জমা হয়েছে!\nআপনার জন্ম নিবন্ধন নম্বর:\n${brnNumber}\n\nএই নম্বরটি সংরক্ষণ করুন।`,
          type: 'success',
        });
      }
    } catch (err) {
      setAlertState({ isOpen: true, message: 'সিস্টেম এরর: ' + (err?.message || err.toString()), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAlertClose = () => {
    setAlertState({ ...alertState, isOpen: false });
    if (alertState.type === 'success') {
      if (submittedBrn) {
        const a = document.createElement('a');
        a.href = `data:text/plain;charset=utf-8,${encodeURIComponent(
          `জন্ম নিবন্ধন নম্বর: ${submittedBrn}\nনাম: ${formData.firstNameBn} ${formData.lastNameBn}\nজন্ম তারিখ: ${formData.dob}`
        )}`;
        a.download = `BRN-${submittedBrn}.txt`;
        // do not auto-download; let user use dashboard
      }
      router.push('/dashboard');
    }
  };

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
            <div key={s} className={`flex-1 text-center py-3 text-sm font-semibold transition-colors ${step === s ? 'text-green-700 border-b-2 border-green-600 bg-white' : 'text-gray-400'}`}>
              {s === 1 ? '১. পরিচিতি' : s === 2 ? '২. পিতা-মাতা' : '৩. ঠিকানা ও সাবমিট'}
            </div>
          ))}
        </div>

        <div className="p-6 md:p-8">
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-800 border-b pb-2">নিবন্ধনাধীন ব্যক্তির পরিচিতি</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-sm font-semibold text-gray-700">নামের প্রথম অংশ (বাংলা)</label><input name="firstNameBn" value={formData.firstNameBn} onChange={handleChange} placeholder="যেমন: মোঃ" className={inputClass} /></div>
                <div><label className="text-sm font-semibold text-gray-700">নামের শেষ অংশ (বাংলা)</label><input name="lastNameBn" value={formData.lastNameBn} onChange={handleChange} placeholder="যেমন: ইমন" className={inputClass} /></div>
                <div><label className="text-sm font-semibold text-gray-700">First Name (English)</label><input name="firstNameEn" value={formData.firstNameEn} onChange={handleChange} placeholder="MD" className={inputClass} /></div>
                <div><label className="text-sm font-semibold text-gray-700">Last Name (English)</label><input name="lastNameEn" value={formData.lastNameEn} onChange={handleChange} placeholder="EMON" className={inputClass} /></div>
                <div><label className="text-sm font-semibold text-gray-700">জন্ম তারিখ</label><input type="date" name="dob" value={formData.dob} onChange={handleChange} className={inputClass} /></div>
                <div><label className="text-sm font-semibold text-gray-700">পিতা-মাতার কততম সন্তান</label><input type="number" name="childOrder" value={formData.childOrder} onChange={handleChange} placeholder="যেমন: ১" className={inputClass} /></div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">লিঙ্গ</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className={selectClass}>
                    <option value="">নির্বাচন করুন</option>
                    <option value="পুরুষ">পুরুষ</option>
                    <option value="মহিলা">মহিলা</option>
                    <option value="হিজড়া">হিজড়া</option>
                  </select>
                </div>
              </div>

              <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mt-8">জন্মস্থানের ঠিকানা</h3>
              <AddressFields prefix="birthAddress" formData={formData} handleChange={handleChange} locations={locations} />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-800 border-b pb-2">পিতার তথ্য</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-sm font-semibold text-gray-700">পিতার জন্ম নিবন্ধন নম্বর</label><input name="fatherBrn" value={formData.fatherBrn} onChange={handleChange} className={inputClass} /></div>
                <div><label className="text-sm font-semibold text-gray-700">জন্ম তারিখ (খ্রিঃ)</label><input type="date" name="fatherDob" value={formData.fatherDob} onChange={handleChange} className={inputClass} /></div>
                <div><label className="text-sm font-semibold text-gray-700">পিতার নাম (বাংলা)</label><input name="fatherNameBn" value={formData.fatherNameBn} onChange={handleChange} className={inputClass} /></div>
                <div><label className="text-sm font-semibold text-gray-700">পিতার নাম (ইংরেজি)</label><input name="fatherNameEn" value={formData.fatherNameEn} onChange={handleChange} className={inputClass} /></div>
                <div><label className="text-sm font-semibold text-gray-700">জাতীয়তা</label><input name="fatherNationality" value={formData.fatherNationality} onChange={handleChange} className={inputClass} /></div>
              </div>

              <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mt-8">মাতার তথ্য</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-sm font-semibold text-gray-700">মাতার জন্ম নিবন্ধন নম্বর</label><input name="motherBrn" value={formData.motherBrn} onChange={handleChange} className={inputClass} /></div>
                <div><label className="text-sm font-semibold text-gray-700">জন্ম তারিখ (খ্রিঃ)</label><input type="date" name="motherDob" value={formData.motherDob} onChange={handleChange} className={inputClass} /></div>
                <div><label className="text-sm font-semibold text-gray-700">মাতার নাম (বাংলা)</label><input name="motherNameBn" value={formData.motherNameBn} onChange={handleChange} className={inputClass} /></div>
                <div><label className="text-sm font-semibold text-gray-700">মাতার নাম (ইংরেজি)</label><input name="motherNameEn" value={formData.motherNameEn} onChange={handleChange} className={inputClass} /></div>
                <div><label className="text-sm font-semibold text-gray-700">জাতীয়তা</label><input name="motherNationality" value={formData.motherNationality} onChange={handleChange} className={inputClass} /></div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center bg-green-50 p-4 rounded-lg border border-green-200">
                <input type="checkbox" name="permanentSame" checked={formData.permanentSame} onChange={handleChange} className="w-5 h-5 text-green-600 rounded mr-3 cursor-pointer" />
                <label className="font-semibold text-green-800 cursor-pointer">জন্মস্থানের ঠিকানা ও স্থায়ী ঠিকানা একই</label>
              </div>

              {!formData.permanentSame && (
                <>
                  <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mt-6">স্থায়ী ঠিকানা</h3>
                  <AddressFields prefix="permanentAddress" formData={formData} handleChange={handleChange} locations={locations} />
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

      <CustomAlert
        isOpen={alertState.isOpen}
        message={alertState.message}
        type={alertState.type}
        onClose={handleAlertClose}
      />
    </div>
  );
}