import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUser(user);

      const { data } = await supabase.from('birth_applications').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      setApplications(data || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div className="text-center mt-20 text-lg font-bold">লোড হচ্ছে...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* হেডার ও প্রোফাইল কার্ড */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-green-700 p-6 flex justify-between items-center text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-800 rounded-full flex items-center justify-center text-xl font-bold">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold">আমার ড্যাশবোর্ড</h2>
                <p className="text-sm text-green-200">{user?.email}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href="/" className="bg-green-800 px-4 py-2 rounded hover:bg-green-900 transition text-sm">← হোম</Link>
              <button onClick={async () => { await supabase.auth.signOut(); router.push('/'); }} className="bg-red-500 px-4 py-2 rounded hover:bg-red-600 transition text-sm">লগআউট</button>
            </div>
          </div>
          
          <div className="p-6 flex justify-between items-center bg-gray-50 border-b">
            <div>
              <h3 className="text-lg font-bold text-gray-800">আমার আবেদনসমূহ</h3>
              <p className="text-sm text-gray-500">মোট আবেদন: {applications.length} টি</p>
            </div>
            <Link href="/apply" className="bg-green-600 text-white px-6 py-2 rounded shadow hover:bg-green-700 text-sm font-bold transition">
              + নতুন আবেদন
            </Link>
          </div>

          <div className="p-6">
            {applications.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-gray-500 mb-4">আপনার কোনো আবেদন নেই।</p>
                <Link href="/apply" className="text-green-600 font-bold hover:underline">এখানে ক্লিক করে নতুন আবেদন করুন</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div key={app.id} className="border p-4 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center bg-white shadow-sm hover:shadow-md transition">
                    <div className="space-y-1">
                      <p className="font-mono text-blue-600 font-bold text-lg">BRN: {app.tracking_id}</p>
                      <p className="font-medium text-gray-800">{app.first_name_bn} {app.last_name_bn}</p>
                      <p className="text-sm text-gray-500">জন্ম তারিখ: {app.dob} | জেলা: {app.district}</p>
                    </div>
                    <div className="mt-4 md:mt-0 flex items-center gap-3">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full text-white ${app.status === 'Pending' ? 'bg-yellow-500' : 'bg-green-600'}`}>
                        {app.status === 'Pending' ? 'যাচাই চলছে' : 'অনুমোদিত'}
                      </span>
                      {app.status === 'Approved' && app.pdf_url && (
                        <a href={app.pdf_url} target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 shadow">
                          ডাউনলোড
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* নির্দেশনা সেকশন */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-blue-800 mb-3">জরুরি নির্দেশনা</h3>
          <ul className="list-disc list-inside text-sm text-blue-700 space-y-2">
            <li>আবেদন করার পর আপনার দেওয়া তথ্যগুলো ভালোভাবে যাচাই করুন।</li>
            <li>সার্টিফিকেট অনুমোদিত হওয়ার পর ড্যাশবোর্ড থেকে ডাউনলোড করা যাবে।</li>
            <li>যেকোনো সমস্যায় ট্র্যাকিং পেজে গিয়ে স্ট্যাটাস চেক করুন।</li>
          </ul>
        </div>

      </div>
    </div>
  );
}