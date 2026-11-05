import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';

export default function UpdatePassword() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase স্বয়ংক্রিয়ভাবে URL থেকে টোকেন নিয়ে সেশন তৈরি করে
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      alert('এরর: ' + error.message);
    } else {
      alert('পাসওয়ার্ড সফলভাবে আপডেট হয়েছে! এখন লগইন করুন।');
      router.push('/login');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">নতুন পাসওয়ার্ড দিন</h2>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">নতুন পাসওয়ার্ড</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700">
            {loading ? 'আপডেট হচ্ছে...' : 'পাসওয়ার্ড আপডেট করুন'}
          </button>
        </form>
      </div>
    </div>
  );
}