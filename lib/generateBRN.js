export const generate17DigitBRN = (dobYear, districtCode, upazilaCode, unionName, wardNo) => {
  const year = dobYear || new Date().getFullYear().toString();
  
  // ১. জেলা কোড (২ ডিজিট)
  const dCode = (districtCode || '00').toString().padStart(2, '0');
  
  // ২. উপজেলা কোড (২ ডিজিট)
  const uCode = (upazilaCode || '00').toString().padStart(2, '0');

  // ৩. RMO কোড (১ ডিজিট): সিটি=৯, পৌরসভা=২, ইউনিয়ন=১
  let rmoCode = '1'; 
  const nameUpper = (unionName || '').toUpperCase();

  if (nameUpper.includes('CITY CORPORATION') || nameUpper.includes('সিটি কর্পোরেশন')) {
    rmoCode = '9';
  } else if (nameUpper.includes('PAURASHAVA') || nameUpper.includes('POURASHAVA') || nameUpper.includes('পৌরসভা')) {
    rmoCode = '2';
  } else if (
    nameUpper.includes('UNION PORISHOD') || 
    nameUpper.includes('UNION PARISHAD') || 
    nameUpper.includes('ইউনিয়ন পরিষদ')
  ) {
    rmoCode = '1'; // নিশ্চিত করা হলো
  }

  // ৪. ইউনিয়ন/ওয়ার্ড কোড (২ ডিজিট)
  let unionCode = '01';
  if (wardNo) {
    unionCode = wardNo.toString().padStart(2, '0');
  }

  // ৫. সিরিয়াল নম্বর (৬ ডিজিট)
  const serialCode = Math.floor(1 + Math.random() * 999999).toString().padStart(6, '0');

  return `${year}${dCode}${rmoCode}${uCode}${unionCode}${serialCode}`;
};