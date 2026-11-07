import React from 'react';

const toBnDigits = (n) => {
  const bn = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
  return String(n).replace(/\d/g, (d) => bn[+d]);
};

export default function StatsSection({ liveStats }) {
  const formatNum = (n) => {
    if (typeof n !== 'number') return '—';
    if (n >= 1000) return `${toBnDigits(Math.floor(n / 1000))},${toBnDigits(n % 1000).padStart(3, '0')}+`;
    return `${toBnDigits(n)}+`;
  };

  const stats = [
    { number: formatNum(liveStats?.total ?? 0), label: 'মোট নিবন্ধন' },
    { number: formatNum(liveStats?.approved ?? 0), label: 'অনুমোদিত সার্টিফিকেট' },
    { number: '৬৪', label: 'জেলা কভারেজ' },
    { number: '৪৯২', label: 'উপজেলা কভারেজ' },
  ];

  return (
    <div className="bg-green-800 text-white py-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((stat, index) => (
            <div key={index} className="p-4 border border-green-700 rounded-lg bg-green-900/50">
              <h3 className="text-3xl font-extrabold text-yellow-400 mb-2">{stat.number}</h3>
              <p className="text-sm font-medium text-green-100">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}