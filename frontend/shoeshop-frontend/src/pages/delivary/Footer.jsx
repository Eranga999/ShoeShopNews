import React from 'react';

const Footer = () => (
  <footer className="w-full bg-white border-t border-gray-200 py-4 px-6 text-center text-gray-500 text-sm shadow-inner mt-10">
    <span>&copy; {new Date().getFullYear()} ShoeShop Delivery. All rights reserved.</span>
    <span className="ml-2">
      <a href="https://yourcompany.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Visit us</a>
    </span>
  </footer>
);

export default Footer; 