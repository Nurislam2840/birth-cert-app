import { useState } from 'react';
import { supabase, isAdmin } from '../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      alert(error.message);
    } else {
      router.push(isAdmin(data.user.email) ? '/admin' : '/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border-t-4 border-green-600">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">নাগরিক লগইন</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">ইমেইল</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">পাসওয়ার্ড</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500" />
          </div>

          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">পাসওয়ার্ড ভুলে গেছেন?</Link>
          </div>

          <button type="submit" disabled={loading} className="w-full py-2 bg-green-600 text-white font-bold rounded-md hover:bg-green-700">
            {loading ? 'অপেক্ষা করুন...' : 'লগইন করুন'}
          </button>
        </form>
        <p className="text-center text-sm mt-4 text-gray-600">অ্যাকাউন্ট নেই? <Link href="/register" className="text-blue-600 font-bold">রেজিস্ট্রেশন করুন</Link></p>

        <div className="mt-6 pt-4 border-t text-center">
          <p className="text-sm text-gray-500">আপনি কি অ্যাডমিন?</p>
          <Link href="/admin/login" className="text-sm text-gray-800 font-bold hover:underline">অ্যাডমিন লগইন</Link>
        </div>
      </div>
    </div>
  );
}