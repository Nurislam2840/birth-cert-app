import React, { useState, useEffect, useRef } from 'react';

// ইংরেজি সংখ্যাকে বাংলায় রূপান্তর করার ফাংশন
const toBnDigits = (num) => {
  if (num === undefined || num === null) return '০';
  const bn = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
  return String(num).replace(/\d/g, (d) => bn[+d]);
};

// 🟢 কাউন্টার এনিমেশন কম্পোনেন্ট
const AnimatedCounter = ({ value }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    if (typeof value !== 'number') return;

    let start = 0;
    const end = value;
    const duration = 2000; // ২ সেকেন্ড সময় নিবে
    const incrementTime = Math.max(Math.floor(duration / (end || 1)), 30); // কত দ্রুত বাড়বে

    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= end) clearInterval(timer);
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value]);

  return <span ref={ref}>{toBnDigits(count)}</span>;
};

export default function StatsSection({ liveStats }) {
  // 🟢 ৮টি লাইভ কার্ড
  const stats = [
    { key: 'totalApps', number: liveStats?.totalApps || 0, label: 'মোট আবেদন' },
    { key: 'approvedApps', number: liveStats?.approvedApps || 0, label: 'অনুমোদিত' },
    { key: 'divisions', number: liveStats?.divisions || 0, label: 'বিভাগ' },
    { key: 'districts', number: liveStats?.districts || 0, label: 'জেলা' },
    { key: 'upazilas', number: liveStats?.upazilas || 0, label: 'উপজেলা' },
    { key: 'unions', number: liveStats?.unions || 0, label: 'ইউনিয়ন' },
    { key: 'paurashavas', number: liveStats?.paurashavas || 0, label: 'পৌরসভা' },
    { key: 'cityCorps', number: liveStats?.cityCorps || 0, label: 'সিটি কর্পোরেশন' },
  ];

  return (
    <div className="bg-gradient-to-b from-green-800 to-green-900 text-white py-16 relative overflow-hidden">
      
      {/* ব্যাকগ্রাউন্ড ডিজাইন (হালকা প্যাটার্ন) */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        
        {/* 🟢 সেকশন হেডিং */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3 tracking-wide">
            এক নজরে আমাদের পরিসংখ্যান
          </h2>
          <p className="text-green-200 text-sm md:text-base max-w-2xl mx-auto">
            সিস্টেমে নিবন্ধিত আবেদন এবং সারাদেশের প্রশাসনিক কভারেজের লাইভ আপডেট
          </p>
          <div className="w-24 h-1 bg-yellow-400 mx-auto mt-6 rounded-full"></div>
        </div>

        {/* ৮টি কার্ডের গ্রিড */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 text-center">
          {stats.map((stat) => (
            <div 
              key={stat.key} 
              className="group p-6 border border-green-700/50 rounded-2xl bg-green-900/40 hover:bg-green-800/60 backdrop-blur-sm transition-all duration-300 shadow-lg hover:shadow-2xl hover:-translate-y-2 flex flex-col justify-center items-center cursor-default"
            >
              <h3 className="text-3xl md:text-5xl font-extrabold text-yellow-400 mb-3 group-hover:scale-110 transition-transform duration-300">
                <AnimatedCounter value={stat.number} />
                <span className="text-2xl md:text-3xl">+</span>
              </h3>
              <p className="text-xs md:text-sm font-semibold text-green-100 tracking-wider">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}