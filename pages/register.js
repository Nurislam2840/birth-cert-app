import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      alert(error.message);
    } else {
      alert('রেজিস্ট্রেশন সফল হয়েছে! এখন লগইন করুন।');
      router.push('/login');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border-t-4 border-green-600">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">নাগরিক রেজিস্ট্রেশন</h2>
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">ইমেইল</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">পাসওয়ার্ড</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-2 bg-green-600 text-white font-bold rounded-md hover:bg-green-700">
            {loading ? 'অপেক্ষা করুন...' : 'রেজিস্ট্রেশন করুন'}
          </button>
        </form>
        <p className="text-center text-sm mt-4 text-gray-600">আগে থেকেই অ্যাকাউন্ট আছে? <Link href="/login" className="text-blue-600 font-bold">লগইন করুন</Link></p>
      </div>
    </div>
  );
}