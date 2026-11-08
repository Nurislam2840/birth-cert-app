import { useState, useRef, useEffect } from 'react';

export default function CustomSelect({ options, value, onChange, placeholder = "নির্বাচন করুন", className = "", disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
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

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full p-3 border rounded-lg text-sm flex justify-between items-center cursor-pointer transition-colors
          ${disabled ? 'bg-gray-200 cursor-not-allowed text-gray-500' : 'bg-gray-50 focus:bg-white border-gray-300 hover:border-green-500'}
          ${isOpen ? 'ring-2 ring-green-500 border-green-500 bg-white' : ''}
        `}
      >
        <span className={!selectedOption ? "text-gray-400" : "text-gray-800"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          <div 
            onClick={() => { onChange({ target: { value: '', name: name } }); setIsOpen(false); }} // ফাঁকা ভ্যালু
            className="p-3 text-sm text-gray-500 cursor-pointer hover:bg-green-50 hover:text-green-700 transition"
          >
            {placeholder}
          </div>
          {options.map((opt) => (
            <div 
              key={opt.value}
              onClick={() => { 
                onChange({ target: { value: opt.value, name: name } }); 
                setIsOpen(false); 
              }}
              className={`p-3 text-sm cursor-pointer transition-colors
                ${value === opt.value ? 'bg-green-100 text-green-800 font-bold' : 'text-gray-700 hover:bg-green-50 hover:text-green-700'}
              `}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}