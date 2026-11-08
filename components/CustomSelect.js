import { useState, useRef, useEffect } from 'react';

export default function CustomSelect({ name, options, value, onChange, placeholder = "নির্বাচন করুন", disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={`relative w-full ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`} ref={wrapperRef}>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full p-2.5 border border-gray-300 rounded-lg text-sm flex justify-between items-center bg-gray-50 transition-all shadow-sm
          ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:border-blue-500 focus:bg-white'}
          ${isOpen ? 'ring-2 ring-blue-500 border-blue-500 bg-white' : ''}
        `}
      >
        <span className={!selectedOption ? "text-gray-500" : "text-gray-800 font-medium"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          <div 
            onClick={() => { onChange({ target: { name, value: '' } }); setIsOpen(false); }} 
            className="p-2.5 text-sm text-gray-500 cursor-pointer hover:bg-blue-50 hover:text-blue-700"
          >
            {placeholder}
          </div>
          {options.map((opt) => (
            <div 
              key={opt.value}
              onClick={() => { onChange({ target: { name, value: opt.value } }); setIsOpen(false); }}
              className={`p-2.5 text-sm cursor-pointer border-t border-gray-50
                ${value === opt.value ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700 hover:bg-gray-50'}
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