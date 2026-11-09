import React from 'react';

// ইংরেজি সংখ্যাকে বাংলায় রূপান্তর করার ফাংশন
const toBnDigits = (num) => {
  if (num === undefined || num === null) return '০';
  const bn = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
  return String(num).replace(/\d/g, (d) => bn[+d]);
};

export default function StatsSection({ liveStats }) {
  const formatNum = (n) => {
    if (typeof n !== 'number') return '০';
    if (n === 0) return '০';
    return toBnDigits(n);
  };

  // 🟢 ৮টি লাইভ কার্ড
  const stats = [
    { number: formatNum(liveStats?.totalApps), label: 'মোট আবেদন' },
    { number: formatNum(liveStats?.approvedApps), label: 'অনুমোদিত' },
    { number: formatNum(liveStats?.divisions), label: 'বিভাগ' },
    { number: formatNum(liveStats?.districts), label: 'জেলা' },
    { number: formatNum(liveStats?.upazilas), label: 'উপজেলা' },
    { number: formatNum(liveStats?.unions), label: 'ইউনিয়ন' },
    { number: formatNum(liveStats?.paurashavas), label: 'পৌরসভা' },
    { number: formatNum(liveStats?.cityCorps), label: 'সিটি কর্পোরেশন' },
  ];

  return (
    <div className="bg-green-800 text-white py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* ৮টি কার্ডের জন্য গ্রিড (মোবাইলে ২টি, ট্যাবে ৪টি) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {stats.map((stat, index) => (
            <div key={index} className="p-5 border border-green-700 rounded-xl bg-green-900/60 shadow-lg flex flex-col justify-center items-center">
              <h3 className="text-3xl md:text-4xl font-extrabold text-yellow-400 mb-2">{stat.number}</h3>
              <p className="text-xs md:text-sm font-medium text-green-100">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}