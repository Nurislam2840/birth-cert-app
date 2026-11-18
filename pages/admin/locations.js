import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function AdminLocations() {
  const [upazilas, setUpazilas] = useState([]);
  const [zones, setZones] = useState([]);
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [zoneData, setZoneData] = useState({ upazila_id: '', type: 'city_corp', name_bn: '', name_en: '' });
  const [wardData, setWardData] = useState({ zone_id: '', ward_no: '', name_bn: '', name_en: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [upaRes, zoneRes, wardRes] = await Promise.all([
      supabase.from('upazilas').select('*').in('type', ['city_corp', 'cantonment']),
      supabase.from('zones').select('*, upazilas(name_bn)').order('id'),
      supabase.from('wards').select('*, zones(name_bn)').order('id')
    ]);
    setUpazilas(upaRes.data || []);
    setZones(zoneRes.data || []);
    setWards(wardRes.data || []);
  };

  const handleAddZone = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('zones').insert([zoneData]);
    if (error) alert(error.message);
    else {
      alert('Zone Added!');
      setZoneData({ upazila_id: '', type: 'city_corp', name_bn: '', name_en: '' });
      fetchData();
    }
    setLoading(false);
  };

  const handleAddWard = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('wards').insert([wardData]);
    if (error) alert(error.message);
    else {
      alert('Ward Added!');
      setWardData({ zone_id: '', ward_no: '', name_bn: '', name_en: '' });
      fetchData();
    }
    setLoading(false);
  };

  const cityZones = zones.filter(z => z.type === 'city_corp');

  return (
    <div className="p-8 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* ১. অঞ্চল/জোন অ্যাড করার ফর্ম */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">অঞ্চল/জোন যোগ করুন</h2>
        <form onSubmit={handleAddZone} className="space-y-4">
          <select required className="w-full p-2 border rounded" value={zoneData.upazila_id} onChange={e => setZoneData({...zoneData, upazila_id: e.target.value})}>
            <option value="">সিটি/ক্যান্টনমেন্ট সিলেক্ট করুন</option>
            {upazilas.map(u => <option key={u.id} value={u.id}>{u.name_bn} ({u.type})</option>)}
          </select>
          <select required className="w-full p-2 border rounded" value={zoneData.type} onChange={e => setZoneData({...zoneData, type: e.target.value})}>
            <option value="city_corp">সিটি কর্পোরেশন</option>
            <option value="cantonment">ক্যান্টনমেন্ট</option>
          </select>
          <input required type="text" placeholder="নাম (বাংলা)" className="w-full p-2 border rounded" value={zoneData.name_bn} onChange={e => setZoneData({...zoneData, name_bn: e.target.value})} />
          <input type="text" placeholder="Name (English)" className="w-full p-2 border rounded" value={zoneData.name_en} onChange={e => setZoneData({...zoneData, name_en: e.target.value})} />
          <button disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded">সেভ করুন</button>
        </form>

        <h3 className="font-bold mt-8 mb-2">অঞ্চল লিস্ট</h3>
        <ul className="text-sm bg-gray-50 p-4 rounded">
          {zones.map(z => <li key={z.id}>{z.upazilas?.name_bn} - {z.name_bn} ({z.type})</li>)}
        </ul>
      </div>

      {/* ২. ওয়ার্ড অ্যাড করার ফর্ম (শুধু সিটি কর্পোরেশনের জন্য) */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">ওয়ার্ড যোগ করুন (শুধু সিটি কর্পোরেশন)</h2>
        <form onSubmit={handleAddWard} className="space-y-4">
          <select required className="w-full p-2 border rounded" value={wardData.zone_id} onChange={e => setWardData({...wardData, zone_id: e.target.value})}>
            <option value="">অঞ্চল সিলেক্ট করুন</option>
            {cityZones.map(z => <option key={z.id} value={z.id}>{z.upazilas?.name_bn} - {z.name_bn}</option>)}
          </select>
          <input required type="text" placeholder="ওয়ার্ড নম্বর (যেমন: 01)" className="w-full p-2 border rounded" value={wardData.ward_no} onChange={e => setWardData({...wardData, ward_no: e.target.value})} />
          <input required type="text" placeholder="নাম (বাংলা)" className="w-full p-2 border rounded" value={wardData.name_bn} onChange={e => setWardData({...wardData, name_bn: e.target.value})} />
          <input type="text" placeholder="Name (English)" className="w-full p-2 border rounded" value={wardData.name_en} onChange={e => setWardData({...wardData, name_en: e.target.value})} />
          <button disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">সেভ করুন</button>
        </form>

        <h3 className="font-bold mt-8 mb-2">ওয়ার্ড লিস্ট</h3>
        <ul className="text-sm bg-gray-50 p-4 rounded">
          {wards.map(w => <li key={w.id}>{w.zones?.name_bn} - {w.name_bn}</li>)}
        </ul>
      </div>
    </div>
  );
}