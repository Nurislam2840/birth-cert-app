import { useState } from 'react';
import { supabase, isAdmin } from '../../lib/supabase';
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
    } else if (!isAdmin(data.user.email)) {
      alert('You are not authorized as an Administrator.');
      await supabase.auth.signOut();
    } else {
      router.push('/admin');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4 font-sans">
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700 overflow-hidden relative">
        
        {/* 🟢 প্রফেশনাল প্রোফাইল সেকশন (আপনার ছবি সহ) */}
        <div className="bg-gradient-to-r from-blue-900 to-gray-800 p-6 flex flex-col items-center border-b border-gray-700">
          <div className="w-28 h-28 rounded-full border-4 border-gray-600 overflow-hidden shadow-lg bg-gray-700 mb-4 relative">
            <img 
              src="https://i.postimg.cc/Px2Z1wbJ/nurislam-copy-600x900.png" 
              alt="MD NUR ISLAM" 
              className="w-full h-full object-cover object-top"
            />
          </div>
          
          <h3 className="text-xl font-bold text-white tracking-wide">MD NUR ISLAM</h3>
          <p className="text-sm text-blue-300 font-medium mt-1">Full Stack Developer</p>
          
          <p className="text-xs text-gray-400 mt-3 text-center px-4 italic">
            "This portal is professionally developed to provide seamless and secure birth registration services."
          </p>
        </div>

        {/* লগইন ফর্ম */}
        <div className="p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white tracking-wide">Admin Portal</h2>
            <p className="text-sm text-gray-400 mt-1">Sign in to manage applications</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
              <input 
                type="email" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <input 
                type="password" 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                placeholder="••••••••"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all shadow-lg disabled:bg-gray-500 mt-2"
            >
              {loading ? 'Authenticating...' : 'Secure Login'}
            </button>
          </form>
          
          <div className="text-center mt-6">
            <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
              ← Back to Citizen Portal
            </Link>
          </div>
        </div>

        {/* ফুটার ডেভেলপার ইনফো */}
        <div className="bg-gray-900 py-3 text-center border-t border-gray-700">
          <p className="text-xs text-gray-500">Developed with ❤️ by MD NUR ISLAM</p>
        </div>
      </div>
    </div>
  );
}