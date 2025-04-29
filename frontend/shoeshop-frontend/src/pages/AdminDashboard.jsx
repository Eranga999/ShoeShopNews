import React, { useEffect, useState } from 'react';
import CustomersList from '../components/CustomersList';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const [activeComponent, setActiveComponent] = useState('dashboard');
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/employeelogin'); // Redirect if no token found
        }
      }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/employeelogin');
      };

  //Function to render the appropriate component based on state
  const renderComponent = () => {
    switch (activeComponent) {
      case 'dashboard':
        return <CustomersList />;
      case 'users':
        return <CustomersList />;
      case 'products':
        return <ProductsList />;
      case 'orders':
        return <OrdersList />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return <CustomersList />;
    }
  };
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md hidden md:block">
        <div className="p-6 text-2xl font-bold border-b border-gray-200">
          Admin Panel
        </div>
        <nav className="mt-6 px-4 space-y-2 text-gray-700">
        <button 
            onClick={() => setActiveComponent('dashboard')}
            className={`block w-full text-left py-2 px-4 rounded hover:bg-gray-200 ${activeComponent === 'dashboard' ? 'bg-gray-200 font-medium' : ''}`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveComponent('users')}
            className={`block w-full text-left py-2 px-4 rounded hover:bg-gray-200 ${activeComponent === 'users' ? 'bg-gray-200 font-medium' : ''}`}
          >
            Users
          </button>
          <button 
            onClick={() => setActiveComponent('products')}
            className={`block w-full text-left py-2 px-4 rounded hover:bg-gray-200 ${activeComponent === 'products' ? 'bg-gray-200 font-medium' : ''}`}
          >
            Products
          </button>
          <button 
            onClick={() => setActiveComponent('orders')}
            className={`block w-full text-left py-2 px-4 rounded hover:bg-gray-200 ${activeComponent === 'orders' ? 'bg-gray-200 font-medium' : ''}`}
          >
            Orders
          </button>
          <button 
            onClick={() => setActiveComponent('settings')}
            className={`block w-full text-left py-2 px-4 rounded hover:bg-gray-200 ${activeComponent === 'settings' ? 'bg-gray-200 font-medium' : ''}`}
          >
            Settings
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Navbar */}
        <header className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">Dashboard Overview</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Admin</span>
            <button onClick={handleLogout} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm">Logout</button>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
            {renderComponent()}
        </main>
      </div>
    </div>
  )
}

export default AdminDashboard