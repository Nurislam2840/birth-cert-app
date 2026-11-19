export const generate17DigitBRN = (dobYear, districtCode, upazilaCode, unionName, wardNo) => {
  // ১. জন্মসাল (৪ ডিজিট)
  let year = (dobYear || new Date().getFullYear()).toString();
  if (year.length > 4) year = year.substring(0, 4); // নিশ্চিত করা হলো ৪ ডিজিট
  year = year.padStart(4, '0');

  // ২. জেলা কোড (২ ডিজিট)
  const dCode = (districtCode || '00').toString().padStart(2, '0');
  
  // ৩. উপজেলা কোড (২ ডিজিট)
  const uCode = (upazilaCode || '00').toString().padStart(2, '0');

  // ৪. RMO কোড (১ ডিজিট): সিটি=৯, পৌরসভা=২, ক্যান্টনমেন্ট=৫, ইউনিয়ন=১
  let rmoCode = '1'; 
  const nameUpper = (unionName || '').toUpperCase();

  if (nameUpper.includes('CITY CORPORATION') || nameUpper.includes('সিটি কর্পোরেশন')) {
    rmoCode = '9';
  } else if (nameUpper.includes('CANTONMENT') || nameUpper.includes('সেনানিবাস') || nameUpper.includes('ক্যান্টনমেন্ট')) {
    rmoCode = '5';
  } else if (nameUpper.includes('PAURASHAVA') || nameUpper.includes('POURASHAVA') || nameUpper.includes('পৌরসভা')) {
    rmoCode = '2';
  }

  // ৫. ওয়ার্ড কোড (২ ডিজিট)
  // আপনার নির্দেশ অনুযায়ী: ওয়ার্ড ৭ হলে '07' হবে
  let wardCode = '01';
  if (wardNo) {
    // যদি ওয়ার্ড নম্বরের সাথে অন্য লেখা থাকে (যেমন: "ওয়ার্ড ৭"), তবে শুধু সংখ্যা বের করবে
    const match = wardNo.toString().match(/\d+/);
    wardCode = (match ? match[0] : wardNo.toString()).padStart(2, '0').slice(-2);
  }

  // ৬. সিরিয়াল নম্বর (৬ ডিজিট)
  const serialCode = Math.floor(1 + Math.random() * 999999).toString().padStart(6, '0');

  // ফাইনাল ১৭ ডিজিট (অরজিনাল ফরম্যাট অনুযায়ী)
  // Year (4) + District (2) + Upazila (2) + RMO (1) + Ward (2) + Serial (6)
  return `${year}${dCode}${uCode}${rmoCode}${wardCode}${serialCode}`;
};