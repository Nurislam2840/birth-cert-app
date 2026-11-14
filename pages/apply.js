import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import CustomAlert from '../components/CustomAlert';
import CustomSelect from '../components/CustomSelect'; 
import { generate17DigitBRN } from '../lib/generateBRN';

const inputClass = "w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm text-gray-800 bg-gray-50 focus:bg-white shadow-sm";
const Req = () => <span className="text-red-500 ml-1">*</span>;

const DynamicField = ({ field, formData, handleChange }) => {
  const val = formData[field.field_name] || '';
  let options = [];
  if (field.options && Array.isArray(field.options)) {
    options = field.options.map(o => ({ value: o, label: o }));
  }
  return (
    <div>
      <label className="text-sm font-bold text-black">
        {field.label_bn} {field.is_required && <Req />}
      </label>
      {field.field_type === 'text' && (
        <input name={field.field_name} value={val} onChange={handleChange} placeholder={field.placeholder_bn || ''} className={inputClass} required={field.is_required} />
      )}
      {field.field_type === 'date' && (
        <input type="date" name={field.field_name} value={val} onChange={handleChange} className={inputClass} required={field.is_required} />
      )}
      {field.field_type === 'number' && (
        <input type="number" name={field.field_name} value={val} onChange={handleChange} placeholder={field.placeholder_bn || ''} className={inputClass} required={field.is_required} />
      )}
      {field.field_type === 'select' && (
        <CustomSelect name={field.field_name} options={options} value={val} onChange={handleChange} required={field.is_required} />
      )}
    </div>
  );
};

const AddressFields = ({ sectionType, prefix, formData, handleChange, divisions, districts, upazilas, unions, formConfig }) => {
  const currentDiv = formData[prefix].division;
  const currentDist = formData[prefix].district;
  const currentUpazila = formData[prefix].upazila;
  const currentUnion = formData[prefix].union;

  const availableDistricts = currentDiv ? districts.filter(d => d.division_id.toString() === currentDiv) : [];
  const availableUpazilas = currentDist ? upazilas.filter(u => u.district_id.toString() === currentDist) : [];
  const availableUnions = currentUpazila ? unions.filter(un => un.upazila_id.toString() === currentUpazila) : [];

  const selectedUnionObj = availableUnions.find(u => u.id.toString() === currentUnion);
  const isCityOrCantonment = selectedUnionObj 
    ? ((selectedUnionObj.name_bn || '').includes('সিটি কর্পোরেশন') || (selectedUnionObj.name_bn || '').includes('ক্যান্টনমেন্ট'))
    : false;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      {formConfig.filter(f => f.section === sectionType).map(field => {
        // 🟢 ডাটাবেসের ফিল্ডের নাম Camel Case এ থাকায় এখানে সেগুলোই চেক করা হচ্ছে
        if (field.field_name === 'country') return <div key={field.id}><label className="text-sm font-bold text-black">{field.label_bn}</label><CustomSelect name={`${prefix}.country`} options={[{ value: 'বাংলাদেশ', label: 'বাংলাদেশ' }]} value={formData[prefix].country} onChange={handleChange} /></div>;
        if (field.field_name === 'division') return <div key={field.id}><label className="text-sm font-bold text-black">{field.label_bn}</label><CustomSelect name={`${prefix}.division`} options={divisions.map(d => ({ value: d.id.toString(), label: d.name_bn }))} value={formData[prefix].division} onChange={handleChange} /></div>;
        if (field.field_name === 'district') return <div key={field.id}><label className="text-sm font-bold text-black">{field.label_bn}</label><CustomSelect name={`${prefix}.district`} options={availableDistricts.map(d => ({ value: d.id.toString(), label: d.name_bn }))} value={formData[prefix].district} onChange={handleChange} disabled={!currentDiv} /></div>;
        if (field.field_name === 'upazila') return <div key={field.id}><label className="text-sm font-bold text-black">{field.label_bn}</label><CustomSelect name={`${prefix}.upazila`} options={availableUpazilas.map(u => ({ value: u.id.toString(), label: u.name_bn }))} value={formData[prefix].upazila} onChange={handleChange} disabled={!currentDist} /></div>;
        if (field.field_name === 'union') return <div key={field.id}><label className="text-sm font-bold text-black">{field.label_bn}</label><CustomSelect name={`${prefix}.union`} options={availableUnions.map(u => ({ value: u.id.toString(), label: u.name_bn }))} value={formData[prefix].union} onChange={handleChange} disabled={!currentUpazila} /></div>;
        if (field.field_name === 'zone') {
          if (!isCityOrCantonment) return null;
          return <div key={field.id}><label className="text-sm font-bold text-black">{field.label_bn}</label><CustomSelect name={`${prefix}.zone`} options={(field.options || []).map(o => ({ value: o, label: o }))} value={formData[prefix].zone || ''} onChange={handleChange} placeholder="অঞ্চল নির্বাচন করুন" /></div>;
        }
        if (field.field_name === 'area') {
          if (!isCityOrCantonment) return null;
          return <div key={field.id}><label className="text-sm font-bold text-black">{field.label_bn}</label><CustomSelect name={`${prefix}.area`} options={(field.options || []).map(o => ({ value: o, label: o }))} value={formData[prefix].area || ''} onChange={handleChange} placeholder="এরিয়া নির্বাচন করুন" /></div>;
        }
        if (field.field_name === 'ward') {
          if (isCityOrCantonment) {
            return <div key={field.id}><label className="text-sm font-bold text-black">{field.label_bn}</label><CustomSelect name={`${prefix}.ward`} options={(field.options || []).map(o => ({ value: o, label: o }))} value={formData[prefix].ward || ''} onChange={handleChange} placeholder="ওয়ার্ড নির্বাচন করুন" allowCustom={true} /></div>;
          }
          return <div key={field.id}><label className="text-sm font-bold text-black">{field.label_bn}</label><CustomSelect name={`${prefix}.ward`} options={[1,2,3,4,5,6,7,8,9].map(w => ({ value: w.toString(), label: w.toString() }))} value={formData[prefix].ward} onChange={handleChange} /></div>;
        }
        if (field.field_name === 'postOfficeBn') return <div key={field.id}><label className="text-sm font-bold text-black">{field.label_bn}</label><input name={`${prefix}.postOfficeBn`} value={formData[prefix].postOfficeBn || ''} onChange={handleChange} className={inputClass} /></div>;
        if (field.field_name === 'postOfficeEn') return <div key={field.id}><label className="text-sm font-bold text-black">{field.label_bn}</label><input name={`${prefix}.postOfficeEn`} value={formData[prefix].postOfficeEn || ''} onChange={handleChange} className={inputClass} /></div>;
        if (field.field_name === 'villageBn') return <div key={field.id}><label className="text-sm font-bold text-black">{field.label_bn}</label><input name={`${prefix}.villageBn`} value={formData[prefix].villageBn || ''} onChange={handleChange} className={inputClass} /></div>;
        if (field.field_name === 'villageEn') return <div key={field.id}><label className="text-sm font-bold text-black">{field.label_bn}</label><input name={`${prefix}.villageEn`} value={formData[prefix].villageEn || ''} onChange={handleChange} className={inputClass} /></div>;
        if (field.field_name === 'houseRoadBn') return <div key={field.id}><label className="text-sm font-bold text-black">{field.label_bn}</label><input name={`${prefix}.houseRoadBn`} value={formData[prefix].houseRoadBn || ''} onChange={handleChange} className={inputClass} /></div>;
        if (field.field_name === 'houseRoadEn') return <div key={field.id}><label className="text-sm font-bold text-black">{field.label_bn}</label><input name={`${prefix}.houseRoadEn`} value={formData[prefix].houseRoadEn || ''} onChange={handleChange} className={inputClass} /></div>;
        return null;
      })}
    </div>
  );
};

const defaultAddress = {
  country: 'বাংলাদেশ', division: '', district: '', upazila: '', union: '', zone: '', area: '', ward: '', postOfficeBn: '', postOfficeEn: '', villageBn: '', villageEn: '', houseRoadBn: '', houseRoadEn: '',
};

export default function Apply() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [divisions, setDivisions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [upazilas, setUpazilas] = useState([]);
  const [unions, setUnions] = useState([]);

  const [formConfig, setFormConfig] = useState([]);
  const [formData, setFormData] = useState({
    birthAddress: { ...defaultAddress },
    permanentAddress: { ...defaultAddress },
    permanentSame: false,
  });

  const [alertState, setAlertState] = useState({ isOpen: false, message: '', type: 'success' });
  const [submittedTrackingId, setSubmittedTrackingId] = useState(null);

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

    const fetchFormConfig = async () => {
      const { data } = await supabase.from('form_fields').select('*').eq('is_active', true).order('step').order('order_index');
      if (data) {
        setFormConfig(data);
        const initialData = {};
        data.forEach(f => {
            if(f.section === 'main' || !f.section) initialData[f.field_name] = '';
        });
        setFormData(prev => ({ ...prev, ...initialData }));
      }
    };
    fetchFormConfig();
  }, [router]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleSubmit = async () => {
    for (const field of formConfig) {
      if (field.is_required && !formData[field.field_name] && (field.section === 'main' || !field.section)) {
        return setAlertState({ isOpen: true, message: `${field.label_bn} আবশ্যক।`, type: 'error' });
      }
    }

    setLoading(true);
    const birthYear = formData.dob ? formData.dob.split('-')[0] : '';
    const selDist = districts.find(d => d.id.toString() === formData.birthAddress.district);
    const selUpa = upazilas.find(u => u.id.toString() === formData.birthAddress.upazila);
    const selUni = unions.find(u => u.id.toString() === formData.birthAddress.union);
    const trackingId = generate17DigitBRN(birthYear, selDist?.code, selUpa?.code, selUni?.name_en, formData.birthAddress.ward);

    // 🟢 ডাটাবেসের ফিল্ডের নাম অনুযায়ী (Camel Case) ম্যাপ করা হলো
    const payload = {
      user_id: user.id,
      tracking_id: trackingId,
      status: 'Pending',
      
      first_name_bn: formData.firstNameBn,
      last_name_bn: formData.lastNameBn,
      first_name_en: formData.firstNameEn,
      last_name_en: formData.lastNameEn,
      dob: formData.dob,
      gender: formData.gender,
      father_name_bn: formData.fatherNameBn,
      father_name_en: formData.fatherNameEn,
      mother_name_bn: formData.motherNameBn,
      mother_name_en: formData.motherNameEn,
      
      division: formData.birthAddress?.division || '',
      district: formData.birthAddress?.district || '',
      city_corp: formData.birthAddress?.upazila || '',
      union_name: formData.birthAddress?.union || '',
      ward: formData.birthAddress?.ward || '',
      zone: formData.birthAddress?.zone || '',
      area: formData.birthAddress?.area || '',
      village_bn: formData.birthAddress?.villageBn || '',
      village_en: formData.birthAddress?.villageEn || '',
      post_office_bn: formData.birthAddress?.postOfficeBn || '',
      post_office_en: formData.birthAddress?.postOfficeEn || '',
      house_road_bn: formData.birthAddress?.houseRoadBn || '',
      house_road_en: formData.birthAddress?.houseRoadEn || '',

      permanent_same: formData.permanentSame,
      permanent_district: formData.permanentSame ? formData.birthAddress?.district : formData.permanentAddress?.district,
      permanent_village_bn: formData.permanentSame ? formData.birthAddress?.villageBn : formData.permanentAddress?.villageBn,
      permanent_village_en: formData.permanentSame ? formData.birthAddress?.villageEn : formData.permanentAddress?.villageEn,
    };

    try {
      const { error } = await supabase.from('birth_applications').insert([payload]);
      if (error) throw error;
      setSubmittedTrackingId(trackingId);
      setAlertState({ isOpen: true, message: `সফলভাবে জমা হয়েছে!`, type: 'success' });
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
          <p className="text-gray-600 mb-6">আপনার জন্ম নিবন্ধন নম্বর:</p>
          <div className="bg-gray-100 p-4 rounded-lg font-mono text-2xl font-bold text-green-700 tracking-widest mb-6 break-all">
            {submittedTrackingId}
          </div>
          <Link href="/dashboard" className="block w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition shadow">
            ড্যাশবোর্ডে যান
          </Link>
        </div>
        <CustomAlert isOpen={alertState.isOpen} message={alertState.message} type={alertState.type} onClose={() => setAlertState({ ...alertState, isOpen: false })} />
      </div>
    );
  }

  const currentFields = formConfig.filter(f => f.step === step && (f.section === 'main' || !f.section));

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
          {/* 🟢 এরর হ্যান্ডলিং: যদি ডাটাবেসে কোনো ফিল্ড না থাকে */}
          {currentFields.length === 0 && (
            <div className="text-center py-10 bg-yellow-50 rounded-lg border border-yellow-200 mb-6">
              <p className="text-yellow-700 font-bold">এই স্টেপের জন্য কোনো ফিল্ড কনফিগার করা নেই!</p>
              <p className="text-sm text-yellow-600 mt-1">অনুগ্রহ করে অ্যাডমিন প্যানেলের Form Builder থেকে ফিল্ড যুক্ত করুন।</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentFields.map(field => (
              <DynamicField key={field.id} field={field} formData={formData} handleChange={handleChange} />
            ))}
          </div>

          {step === 3 && (
            <div className="mt-8 space-y-8">
              <div>
                <h3 className="text-lg font-bold text-black border-b pb-2 mb-4">জন্মস্থান / বর্তমান ঠিকানা</h3>
                <AddressFields sectionType="birth" prefix="birthAddress" formData={formData} handleChange={handleChange} divisions={divisions} districts={districts} upazilas={upazilas} unions={unions} formConfig={formConfig} />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4 border-b pb-2">
                  <h3 className="text-lg font-bold text-black">স্থায়ী ঠিকানা</h3>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer ml-auto">
                    <input type="checkbox" name="permanentSame" checked={formData.permanentSame} onChange={handleChange} className="w-4 h-4 text-green-600 rounded" />
                    জন্মস্থানের ঠিকানা ব্যবহার করুন
                  </label>
                </div>
                
                {!formData.permanentSame ? (
                  <AddressFields sectionType="permanent" prefix="permanentAddress" formData={formData} handleChange={handleChange} divisions={divisions} districts={districts} upazilas={upazilas} unions={unions} formConfig={formConfig} />
                ) : (
                  <p className="text-sm text-gray-500 italic">জন্মস্থানের ঠিকানাটি স্থায়ী ঠিকানা হিসেবে ব্যবহৃত হবে।</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t flex justify-between">
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)} className="px-6 py-2.5 bg-gray-400 text-white font-bold rounded-lg hover:bg-gray-500 transition shadow">← পূর্ববর্তী</button>
          ) : <div></div>}

          {step < 3 ? (
            <button onClick={() => setStep(step + 1)} className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition shadow">পরবর্তী →</button>
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