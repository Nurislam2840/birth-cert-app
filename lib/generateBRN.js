// lib/generateBRN.js

// জেলা কোডের ম্যাপিং
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

// RMO কোড (এলাকার ধরন অনুযায়ী)
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

export const generateBRN = (formData) => {
  // (ক) প্রথম ৪ ডিজিট: জন্ম সাল
  const year = formData.dob ? formData.dob.split('-')[0] : new Date().getFullYear().toString();

  // (খ) পরবর্তী ২ ডিজিট: জেলা কোড
  const districtCode = districtCodes[formData.birthAddress.district] || '00';

  // (গ) পরবর্তী ১ ডিজিট: আরএমও কোড (ইউনিয়ন/পৌরসভা/সিটি)
  const rmoCode = getRMOCode(formData.birthAddress.areaType);

  // (ঘ) পরবর্তী ২ ডিজিট: উপজেলা/থানা কোড
  // যেহেতু ডাইনামিক ডেটাবেস থেকে নাম আসছে, তাই নামের দৈর্ঘ্য বা অক্ষর দিয়ে একটি ডেমো কোড বানানো হচ্ছে।
  // (আপনি চাইলে ডেটাবেসে কোড কলাম রেখে সেটি ব্যবহার করতে পারেন)
  const upazilaName = formData.birthAddress.upazila || '';
  let upazilaCode = '00';
  if (upazilaName) {
    // নামের অক্ষরগুলোর মোট মান নিয়ে ২ ডিজিটের কোড তৈরি
    let sum = 0;
    for (let i = 0; i < upazilaName.length; i++) sum += upazilaName.charCodeAt(i);
    upazilaCode = (sum % 90 + 10).toString(); 
  }

  // (ঙ) পরবর্তী ২ ডিজিট: ইউনিয়ন/ওয়ার্ড কোড
  let unionWardCode = '01';
  if (formData.birthAddress.areaType === 'সিটি কর্পোরেশন' || formData.birthAddress.areaType === 'পৌরসভা') {
    // সিটি বা পৌরসভার ক্ষেত্রে ওয়ার্ড নম্বর
    const wardNum = parseInt(formData.birthAddress.ward);
    unionWardCode = isNaN(wardNum) ? '01' : wardNum.toString().padStart(2, '0').slice(-2);
  } else {
    // ইউনিয়ন পরিষদ হলে ইউনিয়নের নাম থেকে কোড (ডেমো)
    const unionName = formData.birthAddress.union || '';
    if (unionName) {
      let sum = 0;
      for (let i = 0; i < unionName.length; i++) sum += unionName.charCodeAt(i);
      unionWardCode = (sum % 90 + 10).toString();
    }
  }

  // (চ) শেষ ৬ ডিজিট: ক্রমিক নং (000001 - 999999)
  const serialCode = Math.floor(1 + Math.random() * 999999).toString().padStart(6, '0');

  // মোট ১৭ ডিজিট (4 + 2 + 1 + 2 + 2 + 6 = 17)
  return `${year}${districtCode}${rmoCode}${upazilaCode}${unionWardCode}${serialCode}`;
};