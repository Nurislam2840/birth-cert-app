// lib/generateBRN.js

const districtCodes = {
  'বরগুনা': '04', 'বরিশাল': '06', 'ভোলা': '09', 'ঝালকাঠি': '42', 'পটুয়াখালী': '78', 'পিরোজপুর': '79',
  'বান্দরবান': '03', 'ব্রাহ্মণবাড়িয়া': '12', 'চাঁদপুর': '13', 'চট্টগ্রাম': '15', 'কুমিল্লা': '19', 'কক্সবাজার': '22', 'ফেনী': '30', 'খাগড়াছড়ি': '46', 'লক্ষ্মীপুর': '51', 'নোয়াখালী': '75', 'রাঙ্গামাটি': '84',
  'ঢাকা': '26', 'ফরিদপুর': '29', 'গাজীপুর': '33', 'গোপালগঞ্জ': '35', 'কিশোরগঞ্জ': '48', 'মাদারীপুর': '54', 'মানিকগঞ্জ': '56', 'মুন্সিগঞ্জ': '59', 'নারায়ণগঞ্জ': '67', 'নরসিংদী': '68', 'রাজবাড়ী': '82', 'শরীয়তপুর': '86', 'টাঙ্গাইল': '93',
  'বাগেরহাট': '01', 'চুয়াডাঙ্গা': '18', 'যশোর': '41', 'ঝিনাইদহ': '44', 'খুলনা': '47', 'কুষ্টিয়া': '50', 'মাগুরা': '55', 'মেহেরপুর': '57', 'নড়াইল': '65', 'সাতক্ষীরা': '87',
  'জামালপুর': '39', 'ময়মনসিংহ': '61', 'নেত্রকোণা': '72', 'শেরপুর': '89',
  'বগুড়া': '10', 'জয়পুরহাট': '38', 'নওগাঁ': '64', 'নাটোর': '69', 'চাঁপাইনবাবগঞ্জ': '70', 'পাবনা': '76', 'রাজশাহী': '81', 'সিরাজগঞ্জ': '88',
  'দিনাজপুর': '27', 'গাইবান্ধা': '32', 'কুড়িগ্রাম': '49', 'লালমনিরহাট': '52', 'নীলফামারী': '73', 'পঞ্চগড়': '77', 'রংপুর': '85', 'ঠাকুরগাঁও': '94',
  'হবিগঞ্জ': '36', 'মৌলভীবাজার': '58', 'সুনামগঞ্জ': '90', 'সিলেট': '91'
};

const getRMOCode = (areaType) => {
  switch (areaType) {
    case 'ইউনিয়ন পরিষদ': return '1';
    case 'পৌরসভা': return '2';
    case 'ক্যান্টনমেন্ট বোর্ড': return '5';
    case 'সিটি কর্পোরেশন': return '9';
    case 'দূতাবাস': return '0';
    default: return '1';
  }
};

/**
 * Generate a BRN (Birth Registration Number).
 * 
 * @param {object} formData - The form data
 * @param {number} [existingCount=0] - Number of existing applications for the same area/serial to avoid duplicates.
 * @param {number} [retry=0] - Internal retry counter to avoid infinite loops.
 * @returns {string} 17-digit BRN
 */
export const generateBRN = (formData, existingCount = 0, retry = 0) => {
  const year = formData.dob ? formData.dob.split('-')[0] : new Date().getFullYear().toString();
  const districtCode = districtCodes[formData.birthAddress.district] || '00';
  const rmoCode = getRMOCode(formData.birthAddress.areaType);

  const upazilaName = formData.birthAddress.upazila || '';
  let upazilaCode = '00';
  if (upazilaName) {
    let sum = 0;
    for (let i = 0; i < upazilaName.length; i++) sum += upazilaName.charCodeAt(i);
    upazilaCode = (sum % 90 + 10).toString();
  }

  let unionWardCode = '01';
  if (formData.birthAddress.areaType === 'সিটি কর্পোরেশন' || formData.birthAddress.areaType === 'পৌরসভা') {
    const wardNum = parseInt(formData.birthAddress.ward);
    unionWardCode = isNaN(wardNum) ? '01' : wardNum.toString().padStart(2, '0').slice(-2);
  } else {
    const unionName = formData.birthAddress.union || '';
    if (unionName) {
      let sum = 0;
      for (let i = 0; i < unionName.length; i++) sum += unionName.charCodeAt(i);
      unionWardCode = (sum % 90 + 10).toString();
    }
  }

  // Serial: base it on existing count + random within a 100 range.
  // This dramatically reduces duplicate risk if UNIQUE constraint exists.
  const serialBase = (existingCount + 1 + Math.floor(Math.random() * 100)) % 1000000;
  const serialCode = (retry === 0 ? serialBase : (serialBase + retry * 337) % 1000000)
    .toString()
    .padStart(6, '0');

  return `${year}${districtCode}${rmoCode}${upazilaCode}${unionWardCode}${serialCode}`;
};

/**
 * Check if a tracking_id already exists in Supabase.
 * Returns { exists, count }.
 */
export const checkTrackingIdExists = async (supabase, trackingId) => {
  const { count, error } = await supabase
    .from('birth_applications')
    .select('id', { count: 'exact', head: true })
    .eq('tracking_id', trackingId);
  if (error) return { exists: false, count: 0, error };
  return { exists: (count || 0) > 0, count: count || 0 };
};