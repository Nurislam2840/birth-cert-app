import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import CustomAlert from '../components/CustomAlert';
import CustomSelect from '../components/CustomSelect'; 
import { generate17DigitBRN } from '../lib/generateBRN';

const inputClass = "w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-sm text-gray-800 bg-gray-50 focus:bg-white shadow-sm";
const Req = () => <span className="text-red-500 ml-1">*</span>;

// ডাইনামিক ফিল্ড
const DynamicField = ({ field, formData, handleChange }) => {
  const val = formData[field.field_name] || '';
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
        <CustomSelect
          name={field.field_name}
          options={[{value:'পুরুষ',label:'পুরুষ'}, {value:'মহিলা',label:'মহিলা'}, {value:'হিজড়া',label:'হিজড়া'}]}
          value={val}
          onChange={handleChange}
          required={field.is_required}
        />
      )}
    </div>
  );
};

// AddressFields (আগের কোড)
const AddressFields = ({ prefix, formData, handleChange, divisions, districts, upazilas, unions }) => {
  // ... আপনার আগের AddressFields কোড ...
  return (
     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
       {/* আপনার আগের ঠিকানার সব ফিল্ড */}
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
        data.forEach(f => initialData[f.field_name] = '');
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
      if (field.is_required && !formData[field.field_name]) {
        return setAlertState({ isOpen: true, message: `${field.label_bn} আবশ্যক।`, type: 'error' });
      }
    }

    setLoading(true);
    const birthYear = formData.dob ? formData.dob.split('-')[0] : '';
    const selDist = districts.find(d => d.id.toString() === formData.birthAddress.district);
    const selUpa = upazilas.find(u => u.id.toString() === formData.birthAddress.upazila);
    const selUni = unions.find(u => u.id.toString() === formData.birthAddress.union);
    const trackingId = generate17DigitBRN(birthYear, selDist?.code, selUpa?.code, selUni?.name_en, formData.birthAddress.ward);

    const payload = {
      user_id: user.id,
      tracking_id: trackingId,
      status: 'Pending',
      ...formData,
      division: formData.birthAddress.division,
      district: formData.birthAddress.district,
      city_corp: formData.birthAddress.upazila,
      union_name: formData.birthAddress.union,
      ward: formData.birthAddress.ward,
      zone: formData.birthAddress.zone,
      area: formData.birthAddress.area,
      village_bn: formData.birthAddress.villageBn,
      village_en: formData.birthAddress.villageEn,
      post_office_bn: formData.birthAddress.postOfficeBn,
      post_office_en: formData.birthAddress.postOfficeEn,
      house_road_bn: formData.birthAddress.houseRoadBn,
      house_road_en: formData.birthAddress.houseRoadEn,
      permanent_same: formData.permanentSame,
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

  const currentFields = formConfig.filter(f => f.step === step);

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentFields.map(field => (
              <DynamicField key={field.id} field={field} formData={formData} handleChange={handleChange} />
            ))}
          </div>

          {step === 3 && (
            <div className="mt-8">
              <h3 className="text-lg font-bold text-black border-b pb-2">ঠিকানা</h3>
              <AddressFields prefix="birthAddress" formData={formData} handleChange={handleChange} divisions={divisions} districts={districts} upazilas={upazilas} unions={unions} />
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