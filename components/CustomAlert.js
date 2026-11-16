import React from 'react';

export default function CustomAlert({ isOpen, message, type = 'success', onClose }) {
  if (!isOpen) return null;

  const isSuccess = type === 'success';
  const bgColor = isSuccess ? 'bg-green-50' : 'bg-red-50';
  const borderColor = isSuccess ? 'border-green-500' : 'border-red-500';
  const textColor = isSuccess ? 'text-green-800' : 'text-red-800';
  const btnColor = isSuccess ? 'bg-green-600 hover:bg-green-700 shadow-green-600/30' : 'bg-red-600 hover:bg-red-700 shadow-red-600/30';
  
  // 🟢 কার্টুন ইমোজি (সাকসেস এবং এরর)
  const icon = isSuccess ? '🎉' : '😵';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className={`bg-white rounded-3xl shadow-2xl w-full max-w-sm border-t-8 ${borderColor} overflow-hidden transform transition-all`}>
        
        <div className={`p-8 text-center ${bgColor}`}>
          <div className="text-7xl mb-4 drop-shadow-md">
            {icon}
          </div>
          <h3 className={`text-2xl font-extrabold mb-3 ${textColor}`}>
            {isSuccess ? 'সফল হয়েছে!' : 'দুঃখিত!'}
          </h3>
          <p className="text-gray-700 font-medium whitespace-pre-line text-lg leading-relaxed">{message}</p>
        </div>

        <div className="p-5 bg-white flex justify-center">
          <button 
            onClick={onClose} 
            className={`w-full py-3 text-white font-bold text-lg rounded-xl shadow-lg transition-transform transform hover:scale-105 active:scale-95 ${btnColor}`}
          >
            ঠিক আছে
          </button>
        </div>
      </div>
    </div>
  );
}