import React from 'react';

export default function StatsSection() {
  const stats = [
    { number: '৫০,০০০+', label: 'মোট নিবন্ধন' },
    { number: '১০,০০০+', label: 'অনুমোদিত সার্টিফিকেট' },
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