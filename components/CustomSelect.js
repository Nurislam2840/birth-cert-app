import { useState, useRef, useEffect } from 'react';

export default function CustomSelect({ name, options, value, onChange, placeholder = "নির্বাচন করুন", disabled = false, allowCustom = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  const handleSelect = (val) => {
    // ইভেন্ট সিমুলেট করা হচ্ছে যাতে apply.js-এর handleChange ঠিকমতো কাজ করে
    onChange({ target: { name: name, value: val, type: 'select-one' } });
    setIsOpen(false);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (customValue.trim()) {
      handleSelect(customValue.trim());
      setCustomValue('');
    }
  };

  return (
    <div className={`relative w-full ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`} ref={wrapperRef}>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full mt-1 p-3 border border-gray-300 rounded-lg text-sm flex justify-between items-center bg-gray-50 transition-all shadow-sm
          ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:border-green-500 focus:bg-white'}
          ${isOpen ? 'ring-2 ring-green-500 border-green-500 bg-white' : ''}
        `}
      >
        <span className={!selectedOption ? "text-gray-500" : "text-gray-800 font-medium"}>
          {/* যদি কাস্টম ভ্যালু থাকে যা অপশনে নেই, তবে সেটাও দেখাবে */}
          {selectedOption ? selectedOption.label : (value ? value : placeholder)}
        </span>
        <svg className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto flex flex-col">
          <div 
            onClick={() => handleSelect('')} 
            className="p-3 text-sm text-gray-500 cursor-pointer hover:bg-green-50 hover:text-green-700 transition border-b"
          >
            {placeholder}
          </div>
          {options.map((opt) => (
            <div 
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={`p-3 text-sm cursor-pointer transition-colors border-b border-gray-50
                ${value === opt.value ? 'bg-green-100 text-green-800 font-bold' : 'text-gray-700 hover:bg-gray-50'}
              `}
            >
              {opt.label}
            </div>
          ))}

          {/* 🟢 কাস্টম অ্যাড সিস্টেম */}
          {allowCustom && (
            <div className="p-3 bg-gray-50 flex gap-2 sticky bottom-0 border-t">
              <input 
                type="text" 
                placeholder="নতুন ওয়ার্ড লিখুন..." 
                value={customValue} 
                onChange={(e) => setCustomValue(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                onClick={(e) => e.stopPropagation()} // ড্রপডাউন বন্ধ হবে না
                onKeyDown={(e) => { if (e.key === 'Enter') handleCustomSubmit(e); }}
              />
              <button 
                type="button" 
                onClick={handleCustomSubmit}
                className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-green-700"
              >
                Add
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}