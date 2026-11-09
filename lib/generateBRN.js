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
    default: return '1';
  }
};

export const generate17DigitBRN = (dobYear, districtName, upazilaName, unionName) => {
  const year = dobYear || new Date().getFullYear().toString();
  const districtCode = districtCodes[districtName] || '00';
  const rmoCode = '1'; // ডেমো ভ্যালু (ইউনিয়ন পরিষদ)

  let upazilaCode = '00';
  if (upazilaName) {
    let sum = 0;
    for (let i = 0; i < upazilaName.length; i++) sum += upazilaName.charCodeAt(i);
    upazilaCode = (sum % 90 + 10).toString();
  }

  let unionCode = '01';
  if (unionName) {
    let sum = 0;
    for (let i = 0; i < unionName.length; i++) sum += unionName.charCodeAt(i);
    unionCode = (sum % 90 + 10).toString();
  }

  const serialCode = Math.floor(1 + Math.random() * 999999).toString().padStart(6, '0');

  return `${year}${districtCode}${rmoCode}${upazilaCode}${unionCode}${serialCode}`;
};