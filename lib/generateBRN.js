export const generate17DigitBRN = (dobYear, districtCode, upazilaCode, unionName, wardNo, isCityCorp) => {
  const year = dobYear || new Date().getFullYear().toString();
  
  // ডেটাবেস থেকে আসা কোড (ফাঁকা থাকলে ডিফল্ট)
  const dCode = (districtCode || '00').padStart(2, '0');
  const uCode = (upazilaCode || '00').padStart(2, '0');

  // RMO কোড (১ ডিজিট): সিটি=৯, পৌরসভা=২, ইউনিয়ন=১
  let rmoCode = '1';
  if (isCityCorp || (unionName || '').includes('সিটি কর্পোরেশন')) rmoCode = '9';
  else if ((unionName || '').includes('পৌরসভা')) rmoCode = '2';

  // ইউনিয়ন/ওয়ার্ড কোড (২ ডিজিট)
  let unionCode = '01';
  if (wardNo) {
    unionCode = wardNo.toString().padStart(2, '0');
  }

  // সিরিয়াল নম্বর (৬ ডিজিট)
  const serialCode = Math.floor(1 + Math.random() * 999999).toString().padStart(6, '0');

  return `${year}${dCode}${rmoCode}${uCode}${unionCode}${serialCode}`;
};