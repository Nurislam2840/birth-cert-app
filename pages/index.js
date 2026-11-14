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

    const loadStats = async () => {
      try {
        const [appsRes, approvedRes, divRes, distRes, upaRes, uniRes] = await Promise.all([
          supabase.from('birth_applications').select('id', { count: 'exact', head: true }),
          supabase.from('birth_applications').select('id', { count: 'exact', head: true }).eq('status', 'Approved'),
          supabase.from('divisions').select('id', { count: 'exact', head: true }),
          supabase.from('districts').select('id', { count: 'exact', head: true }),
          supabase.from('upazilas').select('id', { count: 'exact', head: true }),
          supabase.from('unions').select('name_bn, name_en'),
        ]);

        const allUnions = uniRes.data || [];
        const paurashavas = allUnions.filter(u => (u.name_bn || '').includes('পৌরসভা') || (u.name_en || '').toLowerCase().includes('paurashava'));
        const cityCorps = allUnions.filter(u => (u.name_bn || '').includes('সিটি কর্পোরেশন') || (u.name_en || '').toLowerCase().includes('city corporation'));
        const pureUnions = allUnions.filter(u => 
          !(u.name_bn || '').includes('পৌরসভা') && !(u.name_en || '').toLowerCase().includes('paurashava') &&
          !(u.name_bn || '').includes('সিটি কর্পোরেশন') && !(u.name_en || '').toLowerCase().includes('city corporation')
        );

        setStats({
          totalApps: appsRes.count || 0,
          approvedApps: approvedRes.count || 0,
          divisions: divRes.count || 0,
          districts: distRes.count || 0,
          upazilas: upaRes.count || 0,
          unions: pureUnions.length,
          paurashavas: paurashavas.length,
          cityCorps: cityCorps.length,
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
      
      {/* 🟢 প্রফেশনাল নেভবার (টিল কালার) */}
      <header className="bg-teal-800 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-full shadow-md">
              <img
                src="https://i.postimg.cc/J4t2GLWN/government-of-bangladesh-organization-public-sector-government-fc1aa96622361e91a0a538e6bce4bef9.png"
                alt="Logo"
                className="w-8 h-8 md:w-10 md:h-10"
              />
            </div>
            <div>
              <h1 className="text-sm md:text-lg font-bold leading-tight tracking-wide">জন্ম ও মৃত্যু নিবন্ধন পোর্টাল</h1>
              <p className="text-[10px] md:text-xs text-teal-200">Birth & Death Registration Portal</p>
            </div>
          </div>
          
          <nav className="flex items-center gap-2 md:gap-4 text-xs md:text-sm font-medium">
            <Link href="/track" className="hover:text-yellow-300 transition-colors px-2 py-1 hidden md:block">ট্র্যাকিং</Link>
            {user ? (
              <>
                <Link
                  href={isAdmin(user.email) ? '/admin' : '/dashboard'}
                  className="bg-teal-900 px-3 py-1.5 md:px-4 md:py-2 rounded-lg hover:bg-teal-950 transition-colors shadow-sm"
                >
                  ড্যাশবোর্ড
                </Link>
                <button onClick={handleLogout} className="bg-red-600 px-3 py-1.5 md:px-4 md:py-2 rounded-lg hover:bg-red-700 transition-colors shadow-sm">
                  লগআউট
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-yellow-300 transition-colors px-2 py-1">লগইন</Link>
                <Link href="/register" className="bg-white text-teal-800 font-bold px-3 py-1.5 md:px-4 md:py-2 rounded-lg hover:bg-gray-100 transition-colors shadow-sm">
                  রেজিস্ট্রেশন
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        
        {/* 🟢 হিরো সেকশন */}
        <section className="relative bg-gradient-to-br from-teal-900 via-teal-800 to-teal-700 text-white overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center gap-12 relative z-10">
            <div className="flex-1 space-y-6 text-center md:text-left">
              <span className="inline-block py-1 px-3 rounded-full bg-teal-600/50 text-yellow-300 text-xs md:text-sm font-bold tracking-wider mb-2 border border-teal-500">
                সরকারি ডিজিটাল সেবা
              </span>
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold leading-tight">
                ডিজিটাল নিবন্ধন সেবা <br />
                <span className="text-yellow-400">এখন হাতের মুঠোয়</span>
              </h2>
              <p className="text-base md:text-lg text-teal-100 max-w-xl mx-auto md:mx-0">
                ঘরে বসেই জন্ম ও মৃত্যু নিবন্ধন আবেদন করুন, ট্র্যাক করুন এবং ডিজিটাল সার্টিফিকেট ডাউনলোড করুন সম্পূর্ণ নিরাপদে।
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-6">
                <Link
                  href="/apply"
                  className="px-8 py-3.5 bg-yellow-500 text-teal-900 font-bold rounded-xl shadow-lg hover:bg-yellow-400 transition-transform transform hover:-translate-y-1"
                >
                  জন্ম নিবন্ধন আবেদন
                </Link>
                <Link
                  href="/apply-death"
                  className="px-8 py-3.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold rounded-xl shadow-lg hover:bg-white/20 transition-transform transform hover:-translate-y-1"
                >
                  মৃত্যু নিবন্ধন আবেদন
                </Link>
              </div>
            </div>
            <div className="flex-1 flex justify-center hidden md:flex">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-400 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                <img
                  src="https://i.postimg.cc/G2hjVFLH/c583e512-b7bc-45ed-bed9-fa5b4c5060d7-removalai-preview.png"
                  alt="Certificate Graphic"
                  className="w-full max-w-md drop-shadow-2xl relative z-10"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 🟢 লাইভ স্ট্যাটস */}
        <StatsSection liveStats={stats} />

        {/* 🟢 সার্ভিস সেকশন */}
        <section className="max-w-7xl mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-800">আমাদের সেবাসমূহ</h3>
            {/* 🟢 এখানে বানানটি ঠিক করা হয়েছে */}
            <p className="text-gray-500 mt-2 text-sm md:text-base">নাগরিকদের জন্য প্রদান করা হচ্ছে আধুনিক ডিজিটাল সেবা</p>
            <div className="w-20 h-1 bg-teal-600 mx-auto mt-4 rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* সার্ভিস ১ */}
            <div className="group bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
              <div className="w-14 h-14 bg-teal-100 text-teal-700 rounded-xl flex items-center justify-center mb-6 text-2xl font-bold shadow-sm">১</div>
              <h4 className="text-xl font-bold text-gray-800 mb-3">জন্ম নিবন্ধন</h4>
              <p className="text-gray-600 mb-6 text-sm leading-relaxed">নতুন জন্ম নিবন্ধন আবেদন করুন এবং ডিজিটাল সার্টিফিকেট ডাউনলোড করুন সহজে।</p>
              <Link href="/apply" className="text-teal-700 font-bold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">আবেদন করুন <span>→</span></Link>
            </div>
            {/* সার্ভিস ২ */}
            <div className="group bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
              <div className="w-14 h-14 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mb-6 text-2xl font-bold shadow-sm">২</div>
              <h4 className="text-xl font-bold text-gray-800 mb-3">মৃত্যু নিবন্ধন</h4>
              <p className="text-gray-600 mb-6 text-sm leading-relaxed">মৃত্যু নিবন্ধন আবেদন করুন এবং ডিজিটাল সার্টিফিকেট ডাউনলোড করুন দ্রুত।</p>
              <Link href="/apply-death" className="text-red-600 font-bold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">আবেদন করুন <span>→</span></Link>
            </div>
            {/* সার্ভিস ৩ */}
            <div className="group bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6 text-2xl font-bold shadow-sm">৩</div>
              <h4 className="text-xl font-bold text-gray-800 mb-3">আবেদন ট্র্যাকিং</h4>
              <p className="text-gray-600 mb-6 text-sm leading-relaxed">আপনার আবেদনের সর্বশেষ অবস্থা লাইভ ট্র্যাক করুন একটি ইউনিক আইডি দিয়ে।</p>
              <Link href="/track" className="text-blue-600 font-bold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">ট্র্যাক করুন <span>→</span></Link>
            </div>
          </div>
        </section>

        {/* 🟢 নোটিশ সেকশন */}
        <section className="bg-teal-900 py-20 relative">
          <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
            <div className="text-white">
              <h3 className="text-2xl md:text-3xl font-bold mb-8">কেন আমাদের সেবা নেবেন?</h3>
              <ul className="space-y-6">
                <li className="flex gap-4 items-start">
                  <div className="bg-teal-800 p-2 rounded-full mt-1"><span className="text-yellow-400 font-bold">✔</span></div>
                  <div><h5 className="font-bold text-lg">১০০% অনলাইন</h5><p className="text-teal-200 text-sm mt-1">সম্পূর্ণ ঝামেলামুক্ত এবং কাগজবিহীন আবেদন প্রক্রিয়া।</p></div>
                </li>
                <li className="flex gap-4 items-start">
                  <div className="bg-teal-800 p-2 rounded-full mt-1"><span className="text-yellow-400 font-bold">✔</span></div>
                  <div><h5 className="font-bold text-lg">লাইভ ট্র্যাকিং</h5><p className="text-teal-200 text-sm mt-1">২৪/৭ আপনার আবেদনের স্ট্যাটাস চেক করার সুবিধা।</p></div>
                </li>
                <li className="flex gap-4 items-start">
                  <div className="bg-teal-800 p-2 rounded-full mt-1"><span className="text-yellow-400 font-bold">✔</span></div>
                  <div><h5 className="font-bold text-lg">নিরাপদ ও গোপনীয়</h5><p className="text-teal-200 text-sm mt-1">আপনার ডেটা অত্যন্ত সুরক্ষিত রাখা হয়।</p></div>
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <NoticeBoard />
            </div>
          </div>
        </section>
      </main>

      {/* 🟢 প্রফেশনাল ফুটার */}
      <footer className="bg-gray-900 text-gray-400 py-12 border-t-4 border-teal-600">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="https://i.postimg.cc/J4t2GLWN/government-of-bangladesh-organization-public-sector-government-fc1aa96622361e91a0a538e6bce4bef9.png"
                alt="Logo"
                className="w-10 h-10 bg-white rounded-full p-1"
              />
              <h4 className="text-white font-bold text-lg">জন্ম ও মৃত্যু নিবন্ধন পোর্টাল</h4>
            </div>
            <p className="text-sm leading-relaxed max-w-md">এই পোর্টালটি নাগরিকদের জন্য একটি ডিজিটাল প্ল্যাটফর্ম, যেখানে ঘরে বসেই জন্ম ও মৃত্যু নিবন্ধনের সব ধরনের সেবা পাওয়া যায়।</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-xs">গুরুত্বপূর্ণ লিংক</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="hover:text-teal-400 transition-colors">হোম</Link></li>
              <li><Link href="/track" className="hover:text-teal-400 transition-colors">ট্র্যাকিং</Link></li>
              <li><Link href="/admin/login" className="hover:text-teal-400 transition-colors">অ্যাডমিন লগইন</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-xs">যোগাযোগ</h4>
            <ul className="space-y-2">
              <li>ইমেইল: support@birthcert.gov.bd</li>
              <li>ফোন: ১৬২৬৩</li>
              <li className="pt-4 text-xs text-gray-600">© ২০২৪ ডিজিটাল নিবন্ধন পোর্টাল। সর্বস্বত্ব সংরক্ষিত।</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}