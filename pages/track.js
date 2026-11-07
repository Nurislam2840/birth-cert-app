import { useState } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';

export default function Track() {
  const [trackingId, setTrackingId] = useState('');
  const [application, setApplication] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTrack = async () => {
    if (!trackingId) return alert('ট্র্যাকিং নাম্বার দিন');
    setLoading(true); setErrorMsg(''); setApplication(null);

    const { data, error } = await supabase
      .from('birth_applications')
      .select('*')
      .eq('tracking_id', trackingId.toUpperCase().trim())
      .maybeSingle();

    setLoading(false);

    if (error || !data) setErrorMsg('আবেদন পাওয়া যায়নি! আপনার ট্র্যাকিং নম্বরটি ঠিক আছে কিনা চেক করুন।');
    else setApplication(data);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center pt-16 px-4 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg border-t-4 border-green-600">
        <div className="flex justify-between items-center mb-6">
          <Link href="/" className="text-sm bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 transition text-gray-700 font-medium">← হোম</Link>
          <h2 className="text-xl font-bold text-gray-800">আবেদন ট্র্যাকিং</h2>
          <div className="w-16"></div>
        </div>

        <p className="text-center text-sm text-gray-500 mb-6">আপনার ১৭ ডিজিটের জন্ম নিবন্ধন নম্বরটি নিচে লিখুন</p>

        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            placeholder="যেমন: 2006269001458291"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 uppercase text-center font-mono text-lg tracking-widest"
          />
          <button
            onClick={handleTrack}
            disabled={loading}
            className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition shadow-md disabled:bg-gray-400"
          >
            {loading ? 'খোঁজা হচ্ছে...' : 'স্ট্যাটাস চেক করুন'}
          </button>
        </div>

        {errorMsg && <p className="text-red-500 text-center mt-4 text-sm bg-red-50 p-2 rounded">{errorMsg}</p>}

        {application && (
          <div className="mt-8 p-5 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs text-gray-500">আবেদনকারীর নাম</p>
                <p className="font-bold text-gray-800">{application.first_name_bn} {application.last_name_bn}</p>
              </div>
              <span className={`px-3 py-1 text-xs font-bold text-white rounded-full ${application.status === 'Pending' ? 'bg-yellow-500' : 'bg-green-600'}`}>
                {application.status === 'Pending' ? 'যাচাই চলছে' : 'অনুমোদিত'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
              <p><span className="text-gray-500">জন্ম তারিখ:</span> {application.dob}</p>
              <p><span className="text-gray-500">জেলা:</span> {application.district}</p>
            </div>

            {application.status === 'Approved' && (
              <div className="bg-white p-3 rounded border text-center">
                <p className="text-sm text-gray-600 mb-2">আপনার সার্টিফিকেট তৈরি হয়েছে।</p>
                <Link href="/dashboard" className="inline-block bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-blue-700">
                  ড্যাশবোর্ডে গিয়ে ডাউনলোড করুন
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}