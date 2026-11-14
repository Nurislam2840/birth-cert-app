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
  } else if (field.field_name === 'gender') {
    options = [{ value: 'পুরুষ', label: 'পুরুষ' }, { value: 'মহিলা', label: 'মহিলা' }, { value: 'হিজড়া', label: 'হিজড়া' }];
  } else if (field.field_name === 'child_order') {
    options = Array.from({ length: 15 }, (_, i) => ({ value: `${i + 1}`, label: `${i + 1}` }));
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
        <CustomSelect name={field.field_name} options={options} value={val} onChange={handleChange} placeholder={field.placeholder_bn || "নির্বাচন করুন"} required={field.is_required} />
      )}
    </div>
  );
};

const AddressSection = ({ sectionType, prefix, formData, handleChange, divisions, districts, upazilas, unions, formConfig }) => {
  const currentDiv = formData[`${prefix}division`];
  const currentDist = formData[`${prefix}district`];
  const currentUpazila = formData[`${prefix}upazila`];
  const currentUnion = formData[`${prefix}union`];

  const availableDistricts = currentDiv ? districts.filter(d => d.division_id.toString() === currentDiv) : [];
  const availableUpazilas = currentDist ? upazilas.filter(u => u.district_id.toString() === currentDist) : [];
  const availableUnions = currentUpazila ? unions.filter(un => un.upazila_id.toString() === currentUpazila) : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      {formConfig.filter(f => {
        const fSection = String(f.section || '').trim().toLowerCase();
        return fSection === sectionType;
      }).map(field => {
        const fieldName = field.field_name;

        if (fieldName === `${prefix}country`) return <div key={field.id}><label className="text-sm font-bold text-black">{field.label_bn} <Req /></label><CustomSelect name={fieldName} options={[{ value: 'বাংলাদেশ', label: 'বাংলাদেশ' }]} value={formData[fieldName]} onChange={handleChange} /></div>;
        
        if (fieldName === `${prefix}division`) return <div key={field.id}><label className="text-sm font-bold text-black">{field.label_bn} <Req /></label><CustomSelect name={fieldName} options={divisions.map(d => ({ value: d.id.toString(), label: d.name_bn }))} value={formData[fieldName]} onChange={handleChange} /></div>;
        
        if (fieldName === `${prefix}district`) return <div key={field.id}><label className="text-sm font-bold text-black">{field.label_bn} <Req /></label><CustomSelect name={fieldName} options={availableDistricts.map(d => ({ value: d.id.toString(), label: d.name_bn }))} value={formData[fieldName]} onChange={handleChange} disabled={!currentDiv} /></div>;
        
        if (fieldName === `${prefix}upazila`) return <div key={field.id}><label className="text-sm font-bold text-black">{field.label_bn} <Req /></label><CustomSelect name={fieldName} options={availableUpazilas.map(u => ({ value: u.id.toString(), label: u.name_bn }))} value={formData[fieldName]} onChange={handleChange} disabled={!currentDist} /></div>;
        
        if (fieldName === `${prefix}union`) return <div key={field.id}><label className="text-sm font-bold text-black">{field.label_bn} <Req /></label><CustomSelect name={fieldName} options={availableUnions.map(u => ({ value: u.id.toString(), label: u.name_bn }))} value={formData[fieldName]} onChange={handleChange} disabled={!currentUpazila} /></div>;
        
        if (fieldName === `${prefix}ward`) {
          return <div key={field.id}><label className="text-sm font-bold text-black">{field.label_bn} <Req /></label><CustomSelect name={fieldName} options={[1,2,3,4,5,6,7,8,9].map(w => ({ value: w.toString(), label: w.toString() }))} value={formData[fieldName]} onChange={handleChange} /></div>;
        }
        
        if (fieldName === `${prefix}postOfficeBn`) return <div key={field.id}><label className="text-sm font-bold text-black">{field.label_bn} <Req /></label><input name={fieldName} value={formData[fieldName] || ''} onChange={handleChange} className={inputClass} /></div>;
        if (fieldName === `${prefix}postOfficeEn`) return <div key={field.id}><label className="text-sm font-bold text-black">{field.label_bn} <Req /></label><input name={fieldName} value={formData[fieldName] || ''} onChange={handleChange} className={inputClass} /></div>;
        if (fieldName === `${prefix}villageBn`) return <div key={field.id}><label className="text-sm font-bold text-black">{field.label_bn} <Req /></label><input name={fieldName} value={formData[fieldName] || ''} onChange={handleChange} className={inputClass} /></div>;
        if (fieldName === `${prefix}villageEn`) return <div key={field.id}><label className="text-sm font-bold text-black">{field.label_bn} <Req /></label><input name={fieldName} value={formData[fieldName] || ''} onChange={handleChange} className={inputClass} /></div>;
        if (fieldName === `${prefix}houseRoadBn`) return <div key={field.id}><label className="text-sm font-bold text-black">{field.label_bn}</label><input name={fieldName} value={formData[fieldName] || ''} onChange={handleChange} className={inputClass} /></div>;
        if (fieldName === `${prefix}houseRoadEn`) return <div key={field.id}><label className="text-sm font-bold text-black">{field.label_bn}</label><input name={fieldName} value={formData[fieldName] || ''} onChange={handleChange} className={inputClass} /></div>;

        return null;
      })}
    </div>
  );
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
  const [formData, setFormData] = useState({ permanentSame: false });

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
        const initialData = { permanentSame: false };
        data.forEach(f => initialData[f.field_name] = '');
        setFormData(initialData);
      }
    };
    fetchFormConfig();
  }, [router]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async () => {
    for (const field of formConfig) {
      if (field.is_required && !formData[field.field_name] && (String(field.section).toLowerCase() === 'main' || !field.section)) {
        return setAlertState({ isOpen: true, message: `${field.label_bn} আবশ্যক।`, type: 'error' });
      }
    }

    setLoading(true);
    const birthYear = formData.dob ? formData.dob.split('-')[0] : '';
    const selDist = districts.find(d => d.id.toString() === formData.birth_district);
    const selUpa = upazilas.find(u => u.id.toString() === formData.birth_upazila);
    const selUni = unions.find(u => u.id.toString() === formData.birth_union);
    const trackingId = generate17DigitBRN(birthYear, selDist?.code, selUpa?.code, selUni?.name_en, formData.birth_ward);

    const payload = {
      user_id: user.id,
      tracking_id: trackingId,
      status: 'Pending',
      
      first_name_bn: formData.first_name_bn,
      last_name_bn: formData.last_name_bn,
      first_name_en: formData.first_name_en,
      last_name_en: formData.last_name_en,
      dob: formData.dob,
      gender: formData.gender,
      child_order: formData.child_order,

      father_birth_reg: formData.father_birth_reg,
      father_name_bn: formData.father_name_bn,
      father_name_en: formData.father_name_en,
      father_nationality: formData.father_nationality,

      mother_birth_reg: formData.mother_birth_reg,
      mother_name_bn: formData.mother_name_bn,
      mother_name_en: formData.mother_name_en,
      mother_nationality: formData.mother_nationality,
      
      division: formData.birth_division,
      district: formData.birth_district,
      city_corp: formData.birth_upazila,
      union_name: formData.birth_union,
      ward: formData.birth_ward,
      village_bn: formData.birth_villageBn,
      village_en: formData.birth_villageEn,
      post_office_bn: formData.birth_postOfficeBn,
      post_office_en: formData.birth_postOfficeEn,
      house_road_bn: formData.birth_houseRoadBn,
      house_road_en: formData.birth_houseRoadEn,

      permanent_same: formData.permanentSame,
      permanent_district: formData.permanentSame ? formData.birth_district : formData.perm_district,
      permanent_village_bn: formData.permanentSame ? formData.birth_villageBn : formData.perm_villageBn,
      permanent_village_en: formData.permanentSame ? formData.birth_villageEn : formData.perm_villageEn,
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
      </div>
    );
  }

  const currentFields = formConfig.filter(f => {
    const dbStep = parseInt(f.step || 1, 10);
    const currentStep = parseInt(step, 10);
    return dbStep === currentStep && String(f.section || 'main').trim().toLowerCase() === 'main';
  });

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
            <div key={s} className={`flex-1 text-center py-3 text-sm font-bold ${step === s ? 'text-green-700 border-b-2 border-green-600 bg-white' : 'text-gray-400'}`}>
              {s === 1 ? '১. পরিচিতি' : s === 2 ? '২. পিতা-মাতা' : '৩. ঠিকানা ও সাবমিট'}
            </div>
          ))}
        </div>

        <div className="p-6 md:p-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentFields.map(field => (
              <DynamicField key={field.id} field={field} formData={formData} handleChange={handleChange} />
            ))}
          </div>

          {step === 3 && (
            <div className="mt-8 space-y-8">
              <div>
                <h3 className="text-lg font-bold text-black border-b pb-2 mb-4">জন্মস্থান / বর্তমান ঠিকানা</h3>
                <AddressSection sectionType="birth" prefix="birth_" formData={formData} handleChange={handleChange} divisions={divisions} districts={districts} upazilas={upazilas} unions={unions} formConfig={formConfig} />
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
                  <AddressSection sectionType="permanent" prefix="perm_" formData={formData} handleChange={handleChange} divisions={divisions} districts={districts} upazilas={upazilas} unions={unions} formConfig={formConfig} />
                ) : (
                  <p className="text-sm text-gray-500 italic">জন্মস্থানের ঠিকানাটি স্থায়ী ঠিকানা হিসেবে ব্যবহৃত হবে।</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t flex justify-between">
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)} className="px-6 py-2.5 bg-gray-400 text-white font-bold rounded-lg hover:bg-gray-500 transition">← পূর্ববর্তী</button>
          ) : <div></div>}

          {step < 3 ? (
            <button onClick={() => setStep(step + 1)} className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition">পরবর্তী →</button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md transition disabled:bg-gray-400">
              {loading ? 'সাবমিট হচ্ছে...' : 'চূড়ান্ত সাবমিট করুন'}
            </button>
          )}
        </div>
      </div>

      <CustomAlert isOpen={alertState.isOpen} message={alertState.message} type={alertState.type} onClose={() => setAlertState({ ...alertState, isOpen: false })} />
    </div>
  );
}