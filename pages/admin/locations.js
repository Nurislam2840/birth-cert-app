import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function AdminLocations() {
  const [upazilas, setUpazilas] = useState([]);
  const [zones, setZones] = useState([]);
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('zone'); // 'zone' or 'ward'

  // Form States
  const [zoneData, setZoneData] = useState({ upazila_id: '', type: 'city_corp', name_bn: '', name_en: '' });
  const [wardData, setWardData] = useState({ zone_id: '', ward_no: '', name_bn: '', name_en: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [upaRes, zoneRes, wardRes] = await Promise.all([
      supabase.from('upazilas').select('*').in('type', ['city_corp', 'cantonment']),
      supabase.from('zones').select('*, upazilas(name_bn)').order('created_at', { ascending: false }),
      supabase.from('wards').select('*, zones(name_bn)').order('created_at', { ascending: false })
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
      alert('Zone/Area Added Successfully!');
      setZoneData({ upazila_id: '', type: 'city_corp', name_bn: '', name_en: '' });
      setIsModalOpen(false);
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
      alert('Ward Added Successfully!');
      setWardData({ zone_id: '', ward_no: '', name_bn: '', name_en: '' });
      setIsModalOpen(false);
      fetchData();
    }
    setLoading(false);
  };

  const openZoneModal = () => {
    setModalType('zone');
    setIsModalOpen(true);
  };

  const openWardModal = () => {
    setModalType('ward');
    setIsModalOpen(true);
  };

  const cityZones = zones.filter(z => z.type === 'city_corp' || z.upazilas?.type === 'city_corp');

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">City & Cantonment Management</h1>
            <p className="text-sm text-gray-500 mt-1">Manage Zones/Areas and Wards for City Corporations and Cantonments.</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button onClick={openZoneModal} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors">
              <span className="text-xl">+</span> Add Zone/Area
            </button>
            <button onClick={openWardModal} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors">
              <span className="text-xl">+</span> Add Ward
            </button>
          </div>
        </div>

        {/* Zones List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-semibold text-gray-700">Zones / Areas List</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-white border-b text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-4">সিটি/সেনানিবাস</th>
                  <th className="px-6 py-4">TYPE</th>
                  <th className="px-6 py-4">ZONE NAME</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {zones.length === 0 ? (
                  <tr><td colSpan="3" className="px-6 py-8 text-center text-gray-400">No data found. Add a new area.</td></tr>
                ) : (
                  zones.map(z => (
                    <tr key={z.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-800">{z.upazilas?.name_bn || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${z.type === 'city_corp' ? 'bg-teal-100 text-teal-700' : 'bg-orange-100 text-orange-700'}`}>
                          {z.type === 'city_corp' ? 'City Corp' : 'Cantonment'}
                        </span>
                      </td>
                      <td className="px-6 py-4">{z.name_bn}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Wards List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-semibold text-gray-700">Wards List (City Corp Only)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-white border-b text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-4">ZONE</th>
                  <th className="px-6 py-4">WARD NO</th>
                  <th className="px-6 py-4">WARD NAME</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {wards.length === 0 ? (
                  <tr><td colSpan="3" className="px-6 py-8 text-center text-gray-400">No wards found. Add a new ward.</td></tr>
                ) : (
                  wards.map(w => (
                    <tr key={w.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-800">{w.zones?.name_bn || 'N/A'}</td>
                      <td className="px-6 py-4">{w.ward_no}</td>
                      <td className="px-6 py-4">{w.name_bn}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b">
              <h3 className="text-xl font-bold text-gray-800">
                {modalType === 'zone' ? 'Add New Zone / Area' : 'Add New Ward'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">&times;</button>
            </div>
            
            <div className="p-5">
              {modalType === 'zone' ? (
                <form onSubmit={handleAddZone} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">সিটি কর্পোরেশন / সেনানিবাস</label>
                    <select required className="w-full p-2.5 border rounded-lg focus:ring-teal-500" value={zoneData.upazila_id} onChange={e => setZoneData({...zoneData, upazila_id: e.target.value})}>
                      <option value="">সিলেক্ট করুন</option>
                      {upazilas.map(u => <option key={u.id} value={u.id}>{u.name_bn}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Type</label>
                    <select required className="w-full p-2.5 border rounded-lg focus:ring-teal-500" value={zoneData.type} onChange={e => setZoneData({...zoneData, type: e.target.value})}>
                      <option value="city_corp">City Corporation</option>
                      <option value="cantonment">Cantonment</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Zone/Area Name (বাংলা)</label>
                    <input required type="text" placeholder="যেমন: জোন ১ / বিবিসি ওয়ার্ড ০১" className="w-full p-2.5 border rounded-lg focus:ring-teal-500" value={zoneData.name_bn} onChange={e => setZoneData({...zoneData, name_bn: e.target.value})} />
                  </div>
                  <div className="pt-2 flex justify-end">
                    <button disabled={loading} type="submit" className="bg-teal-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50">
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleAddWard} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">জোন / ওয়ার্ড-অঞ্চল</label>
                    <select required className="w-full p-2.5 border rounded-lg focus:ring-blue-500" value={wardData.zone_id} onChange={e => setWardData({...wardData, zone_id: e.target.value})}>
                      <option value="">সিলেক্ট করুন</option>
                      {cityZones.map(z => <option key={z.id} value={z.id}>{z.upazilas?.name_bn} - {z.name_bn}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Ward No (যেমন: 01)</label>
                    <input required type="text" placeholder="01" className="w-full p-2.5 border rounded-lg focus:ring-blue-500" value={wardData.ward_no} onChange={e => setWardData({...wardData, ward_no: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Ward Name (বাংলা)</label>
                    <input required type="text" placeholder="যেমন: ১ নং ওয়ার্ড" className="w-full p-2.5 border rounded-lg focus:ring-blue-500" value={wardData.name_bn} onChange={e => setWardData({...wardData, name_bn: e.target.value})} />
                  </div>
                  <div className="pt-2 flex justify-end">
                    <button disabled={loading} type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}