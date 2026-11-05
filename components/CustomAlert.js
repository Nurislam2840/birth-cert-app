import React from 'react';

export default function CustomAlert({ isOpen, message, type = 'success', onClose }) {
  if (!isOpen) return null;

  // টাইপ অনুযায়ী কালার সেট করা
  const isSuccess = type === 'success';
  const bgColor = isSuccess ? 'bg-green-50' : 'bg-red-50';
  const borderColor = isSuccess ? 'border-green-500' : 'border-red-500';
  const textColor = isSuccess ? 'text-green-800' : 'text-red-800';
  const btnColor = isSuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700';
  const icon = isSuccess ? '✅' : '❌';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div className={`bg-white rounded-xl shadow-2xl w-full max-w-sm border-t-4 ${borderColor} overflow-hidden transform transition-all`}>
        <div className={`p-6 text-center ${bgColor}`}>
          <div className="text-4xl mb-3">{icon}</div>
          <h3 className={`text-lg font-bold mb-2 ${textColor}`}>
            {isSuccess ? 'সফল হয়েছে!' : 'দুঃখিত!'}
          </h3>
          <p className="text-gray-600 text-sm whitespace-pre-line">{message}</p>
        </div>
        <div className="p-4 bg-white flex justify-center">
          <button 
            onClick={onClose} 
            className={`px-8 py-2 text-white font-bold rounded-lg shadow-md transition ${btnColor}`}
          >
            ঠিক আছে
          </button>
        </div>
      </div>
    </div>
  );
}