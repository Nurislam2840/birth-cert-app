import React from 'react';

export default function NoticeBoard() {
  const notices = [
    { id: 1, date: '১০ নভেম্বর, ২০২৬', text: 'অনলাইনে জন্ম নিবন্ধন আবেদন কার্যক্রম চালু হয়েছে।' },
    { id: 2, date: '০৫ নভেম্বর, ২০২৬', text: 'জন্ম নিবন্ধন সার্টিফিকেট ডাউনলোডের নিয়মাবলি যুক্ত করা হয়েছে।' },
    { id: 3, date: '০১ নভেম্বর, ২০২৬', text: 'সিস্টেম আপডেটের কারণে কিছু সময় সার্ভার ধীরগতির থাকতে পারে।' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg border-t-4 border-green-600 p-6 h-full">
      <div className="flex justify-between items-center border-b pb-3 mb-4">
        <h3 className="text-xl font-bold text-gray-800">জরুরি নোটিশ</h3>
        <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-1 rounded">নতুন</span>
      </div>
      <ul className="space-y-4">
        {notices.map((notice) => (
          <li key={notice.id} className="flex gap-3 text-sm">
            <div className="flex-shrink-0 w-2 h-2 mt-1.5 bg-green-500 rounded-full"></div>
            <div>
              <p className="text-gray-700 hover:text-green-600 cursor-pointer">{notice.text}</p>
              <span className="text-xs text-gray-400">{notice.date}</span>
            </div>
          </li>
        ))}
      </ul>
      <button className="mt-6 w-full py-2 text-sm text-green-700 font-bold border border-green-600 rounded hover:bg-green-50 transition">
        সব নোটিশ দেখুন
      </button>
    </div>
  );
}