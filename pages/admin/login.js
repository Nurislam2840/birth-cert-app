import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function AdminLogin() {
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
      if (data.user.email === 'admin@gmail.com') { // আপনার অ্যাডমিন ইমেইল
        router.push('/admin');
      } else {
        alert('আপনি অ্যাডমিন নন!');
        await supabase.auth.signOut();
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white">অ্যাডমিন প্যানেল</h2>
          <p className="text-sm text-gray-400 mt-2">শুধুমাত্র অনুমোদিত ব্যক্তিদের জন্য</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">ইমেইল</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">পাসওয়ার্ড</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 transition">
            {loading ? 'অপেক্ষা করুন...' : 'লগইন করুন'}
          </button>
        </form>
        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-gray-400 hover:text-white">← নাগরিক পোর্টালে ফিরে যান</Link>
        </div>
      </div>
    </div>
  );
}