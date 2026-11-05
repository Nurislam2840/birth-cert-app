import { useState } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    if (error) {
      setMessage('এরর: ' + error.message);
    } else {
      setMessage('আপনার ইমেইলে পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে। ইনবক্স চেক করুন।');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">পাসওয়ার্ড রিসেট</h2>
        <p className="text-sm text-gray-500 text-center mb-6">আপনার রেজিস্টার্ড ইমেইলটি দিন। আমরা একটি রিসেট লিংক পাঠাবো।</p>
        
        {message && <div className={`p-3 mb-4 rounded text-sm ${message.includes('এরর') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{message}</div>}

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">ইমেইল</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-500" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-2 bg-green-600 text-white font-bold rounded-md hover:bg-green-700">
            {loading ? 'পাঠানো হচ্ছে...' : 'রিসেট লিংক পাঠান'}
          </button>
        </form>
        <p className="text-center text-sm mt-4"><Link href="/login" className="text-blue-600">লগইনে ফিরে যান</Link></p>
      </div>
    </div>
  );
}