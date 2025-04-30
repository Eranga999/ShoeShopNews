import React from 'react';

const Header = ({ userName, onLogout }) => (
  <header className="sticky top-0 z-30 bg-white shadow-md border-b border-gray-200 flex items-center justify-between px-6 py-3">
    <div className="flex items-center gap-3">
      <span className="text-2xl font-extrabold text-blue-700 tracking-tight">ShoeShop Delivery</span>
      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">Manager</span>
    </div>
    <div className="flex items-center gap-4">
      <span className="text-gray-700 font-medium hidden sm:inline">{userName}</span>
      <button
        onClick={onLogout}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-semibold shadow-sm"
      >
        Logout
      </button>
    </div>
  </header>
);

export default Header; 