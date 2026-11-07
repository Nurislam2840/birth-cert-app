import Link from 'next/link';

export default function ApplyDeath() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md text-center border-t-4 border-red-600">
        <h2 className="text-2xl font-bold text-gray-800 mb-3">মৃত্যু নিবন্ধন</h2>
        <p className="text-gray-600 text-sm mb-6">
          মৃত্যু নিবন্ধন সেবাটি বর্তমানে ডেভেলপমেন্টের অধীনে রয়েছে। শীঘ্রই চালু হবে।
        </p>
        <Link href="/" className="inline-block px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition">
          ← হোমে ফিরে যান
        </Link>
      </div>
    </div>
  );
}