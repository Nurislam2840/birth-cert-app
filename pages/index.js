import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase, isAdmin } from '../lib/supabase';
import { useRouter } from 'next/router';
import NoticeBoard from '../components/NoticeBoard';
import StatsSection from '../components/StatsSection';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();

    // 🟢 লাইভ কাউন্ট ডেটা লোড
    const loadStats = async () => {
      try {
        const [appsRes, approvedRes, divRes, distRes, upaRes, uniRes] = await Promise.all([
          supabase.from('birth_applications').select('id', { count: 'exact', head: true }),
          supabase.from('birth_applications').select('id', { count: 'exact', head: true }).eq('status', 'Approved'),
          supabase.from('divisions').select('id', { count: 'exact', head: true }),
          supabase.from('districts').select('id', { count: 'exact', head: true }),
          supabase.from('upazilas').select('id', { count: 'exact', head: true }),
          supabase.from('unions').select('name_bn, name_en'), // পুরো লিস্ট আনছি ফিল্টার করার জন্য
        ]);

        const allUnions = uniRes.data || [];

        // 🟢 পৌরসভা এবং সিটি কর্পোরেশন আলাদা করা
        const paurashavas = allUnions.filter(u => (u.name_bn || '').includes('পৌরসভা') || (u.name_en || '').toLowerCase().includes('paurashava'));
        const cityCorps = allUnions.filter(u => (u.name_bn || '').includes('সিটি কর্পোরেশন') || (u.name_en || '').toLowerCase().includes('city corporation'));
        const pureUnions = allUnions.filter(u => 
          !(u.name_bn || '').includes('পৌরসভা') && 
          !(u.name_en || '').toLowerCase().includes('paurashava') &&
          !(u.name_bn || '').includes('সিটি কর্পোরেশন') && 
          !(u.name_en || '').toLowerCase().includes('city corporation')
        );

        setStats({
          totalApps: appsRes.count || 0,
          approvedApps: approvedRes.count || 0,
          divisions: divRes.count || 0,
          districts: distRes.count || 0,
          upazilas: upaRes.count || 0,
          unions: pureUnions.length,       // শুধু ইউনিয়ন
          paurashavas: paurashavas.length, // শুধু পৌরসভা
          cityCorps: cityCorps.length,     // শুধু সিটি কর্পোরেশন
        });
      } catch (e) {
        console.error("Stats load error:", e);
      }
    };
    loadStats();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-green-700 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img
              src="https://i.postimg.cc/J4t2GLWN/government-of-bangladesh-organization-public-sector-government-fc1aa96622361e91a0a538e6bce4bef9.png"
              alt="Logo"
              className="w-10 h-10 bg-white rounded-full p-1"
            />
            <div>
              <h1 className="text-lg md:text-xl font-bold leading-tight">জন্ম ও মৃত্যু নিবন্ধন পোর্টাল</h1>
              <p className="text-xs text-green-200 hidden md:block">Birth & Death Registration Portal</p>
            </div>
          </div>
          <nav className="flex items-center gap-2 md:gap-4 text-sm">
            <Link href="/track" className="hover:text-green-200 px-2">ট্র্যাকিং</Link>
            {user ? (
              <>
                <Link
                  href={isAdmin(user.email) ? '/admin' : '/dashboard'}
                  className="bg-green-800 px-4 py-2 rounded-md hover:bg-green-900 transition"
                >
                  ড্যাশবোর্ড
                </Link>
                <button onClick={handleLogout} className="bg-red-500 px-3 py-2 rounded-md hover:bg-red-600 transition">
                  লগআউট
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-green-200 px-2">লগইন</Link>
                <Link href="/register" className="bg-white text-green-700 font-bold px-4 py-2 rounded-md hover:bg-gray-100 transition">
                  রেজিস্ট্রেশন
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        <section className="bg-gradient-to-r from-green-800 to-green-600 text-white">
          <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1 space-y-6 text-center md:text-left">
              <h2 className="text-3xl md:text-5xl font-extrabold leading-tight">
                ডিজিটাল নিবন্ধন সেবা <br />
                <span className="text-yellow-300">এখন হাতের মুঠোয়</span>
              </h2>
              <p className="text-lg text-green-100">
                ঘরে বসেই জন্ম ও মৃত্যু নিবন্ধন আবেদন করুন, ট্র্যাক করুন এবং ডিজিটাল সার্টিফিকেট ডাউনলোড করুন।
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
                <Link
                  href="/apply"
                  className="px-8 py-3 bg-white text-green-800 font-bold rounded-lg shadow-lg hover:bg-gray-100 transition transform hover:-translate-y-1"
                >
                  জন্ম নিবন্ধন আবেদন
                </Link>
                <Link
                  href="/apply-death"
                  className="px-8 py-3 bg-red-600 border border-red-500 text-white font-bold rounded-lg shadow-lg hover:bg-red-700 transition transform hover:-translate-y-1"
                >
                  মৃত্যু নিবন্ধন আবেদন
                </Link>
              </div>
            </div>
            <div className="flex-1 flex justify-center">
              <img
                src="https://i.postimg.cc/G2hjVFLH/c583e512-b7bc-45ed-bed9-fa5b4c5060d7-removalai-preview.png"
                alt="Watermark"
                className="w-full max-w-sm drop-shadow-2xl opacity-90"
              />
            </div>
          </div>
        </section>

        {/* 🟢 লাইভ স্ট্যাটস সেকশন (৮টি কার্ড) */}
        <StatsSection liveStats={stats} />

        <section className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-800">আমাদের সেবাসমূহ</h3>
            <p className="text-gray-500 mt-2">নাগরিকদের জন্য 제공 করা হচ্ছে আধুনিক ডিজিটাল সেবা</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-md text-center border-t-4 border-green-600 hover:-translate-y-2 transition duration-300">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">১</div>
              <h4 className="text-xl font-bold text-gray-800 mb-2">জন্ম নিবন্ধন</h4>
              <p className="text-gray-600 mb-4 text-sm">নতুন জন্ম নিবন্ধন আবেদন করুন এবং ডিজিটাল সার্টিফিকেট ডাউনলোড করুন।</p>
              <Link href="/apply" className="text-green-600 font-bold hover:underline">আবেদন করুন →</Link>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-md text-center border-t-4 border-red-600 hover:-translate-y-2 transition duration-300">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">২</div>
              <h4 className="text-xl font-bold text-gray-800 mb-2">মৃত্যু নিবন্ধন</h4>
              <p className="text-gray-600 mb-4 text-sm">মৃত্যু নিবন্ধন আবেদন করুন এবং ডিজিটাল সার্টিফিকেট ডাউনলোড করুন।</p>
              <Link href="/apply-death" className="text-red-600 font-bold hover:underline">আবেদন করুন →</Link>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-md text-center border-t-4 border-blue-600 hover:-translate-y-2 transition duration-300">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">৩</div>
              <h4 className="text-xl font-bold text-gray-800 mb-2">আবেদন ট্র্যাকিং</h4>
              <p className="text-gray-600 mb-4 text-sm">আপনার আবেদনের সর্বশেষ অবস্থা লাইভ ট্র্যাক করুন।</p>
              <Link href="/track" className="text-blue-600 font-bold hover:underline">ট্র্যাক করুন →</Link>
            </div>
          </div>
        </section>

        <section className="bg-gray-100 py-16">
          <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">কেন আমাদের সেবা নেবেন?</h3>
              <ul className="space-y-4">
                <li className="flex gap-3"><span className="text-green-600 font-bold">✔</span> ১০০% অনলাইন এবং ঝামেলামুক্ত আবেদন প্রক্রিয়া।</li>
                <li className="flex gap-3"><span className="text-green-600 font-bold">✔</span> ২৪/৭ লাইভ ট্র্যাকিং সুবিধা।</li>
                <li className="flex gap-3"><span className="text-green-600 font-bold">✔</span> অ্যাডমিন অনুমোদনের পরই ডিজিটাল সার্টিফিকেট।</li>
                <li className="flex gap-3"><span className="text-green-600 font-bold">✔</span> সম্পূর্ণ নিরাপদ ও গোপনীয় ডেটা সিস্টেম।</li>
              </ul>
            </div>
            <div><NoticeBoard /></div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-gray-400 py-8 mt-auto">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
          <div>
            <h4 className="text-white font-bold mb-3">যোগাযোগ</h4>
            <p>ইমেইল: support@birthcert.gov.bd</p>
            <p>ফোন: ১৬২৬৩</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-3">গুরুত্বপূর্ণ লিংক</h4>
            <ul className="space-y-1">
              <li><Link href="/" className="hover:text-white">হোম</Link></li>
              <li><Link href="/track" className="hover:text-white">ট্র্যাকিং</Link></li>
              <li><Link href="/admin/login" className="hover:text-white">অ্যাডমিন লগইন</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-3">আইনগত</h4>
            <p className="text-xs mt-4">© ২০২৪ ডিজিটাল নিবন্ধন পোর্টাল। সর্বস্বত্ব সংরক্ষিত।</p>
          </div>
        </div>
      </footer>
    </div>
  );
}