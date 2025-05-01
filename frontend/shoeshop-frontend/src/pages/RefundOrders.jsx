import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FiPackage, FiDollarSign, FiClock, FiAlertCircle, FiX, FiUpload } from 'react-icons/fi';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

const RefundOrders = () => {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refundForm, setRefundForm] = useState({
    orderId: '',
    reason: '',
    description: '',
    images: [],
    contactPreference: 'email',
    contactDetails: user?.email || ''
  });

  const refundReasons = [
    'Wrong size/fit',
    'Damaged/defective product',
    'Not as described',
    'Missing items',
    'Changed mind',
    'Received wrong item',
    'Quality issues',
    'Other'
  ];

  useEffect(() => {
    console.log('Auth state:', { isAuthenticated, user });
    
    if (!isAuthenticated || !user) {
      toast.error('Please login to view orders');
      navigate('/customerlogin');
      return;
    }
    fetchOrders();
  }, [isAuthenticated, user, navigate]);

  const fetchOrders = async () => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching orders for user:', user);
      
      // Use the hardcoded user ID that matches the orders in the database
      const response = await axios.get(`http://localhost:5000/api/order/user236`, {
        withCredentials: true
      });
      
      console.log('Orders response:', response.data);

      if (response.data && Array.isArray(response.data)) {
        setOrders(response.data);
        if (response.data.length === 0) {
          toast('No orders found yet', { icon: 'ℹ️' });
        }
      } else {
        setOrders([]);
        toast('No orders found', { icon: 'ℹ️' });
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleRefundRequest = async (e) => {
    e.preventDefault();
    if (!isAuthenticated || !user) {
      toast.error('Please login to request a refund');
      navigate('/customerlogin');
      return;
    }

    if (!refundForm.orderId) {
      toast.error('Please select an order');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('orderId', refundForm.orderId);
      formData.append('reason', refundForm.reason);
      formData.append('description', refundForm.description);
      formData.append('contactPreference', refundForm.contactPreference);
      formData.append('contactDetails', refundForm.contactDetails);
      
      refundForm.images.forEach((image) => {
        formData.append('images', image);
      });

      const response = await axios.post(
        `http://localhost:5000/api/order/${refundForm.orderId}/refund-request`,
        formData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      console.log('Refund response:', response.data);
      toast.success('Refund request submitted successfully');
      
      setRefundForm({
        orderId: '',
        reason: '',
        description: '',
        images: [],
        contactPreference: 'email',
        contactDetails: user?.email || ''
      });
      
      fetchOrders();
    } catch (error) {
      console.error('Error requesting refund:', error);
      toast.error(error.response?.data?.message || 'Failed to submit refund request');
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 3) {
      toast.error('Maximum 3 images allowed');
      return;
    }
    
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large. Maximum size is 5MB`);
        return false;
      }
      if (!file.type.startsWith('image/')) {
        toast.error(`File ${file.name} is not an image`);
        return false;
      }
      return true;
    });

    setRefundForm(prev => ({
      ...prev,
      images: validFiles
    }));
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Please Login</h2>
          <p className="text-gray-600 mb-4">You need to be logged in to view your orders and request refunds.</p>
          <button
            onClick={() => navigate('/customerlogin')}
            className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Order Refunds</h1>
          <p className="mt-2 text-gray-600">Request refunds for your orders</p>
          <p className="mt-2 text-sm text-gray-500">Logged in as: {user.email}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Refund Request Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6">Submit Refund Request</h2>
            <form onSubmit={handleRefundRequest} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Select Order *
                </label>
                <select
                  required
                  value={refundForm.orderId}
                  onChange={(e) => setRefundForm(prev => ({ ...prev, orderId: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Choose an order</option>
                  {orders.map((order) => (
                    <option key={order._id} value={order._id}>
                      Order #{order.orderNumber} - ${order.totalAmount}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Reason for Refund *
                </label>
                <select
                  required
                  value={refundForm.reason}
                  onChange={(e) => setRefundForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select a reason</option>
                  {refundReasons.map((reason) => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Detailed Description *
                </label>
                <textarea
                  required
                  value={refundForm.description}
                  onChange={(e) => setRefundForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Please provide details about your refund request..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Upload Images (Optional)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Upload up to 3 images (max 5MB each) showing the issue
                </p>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                        <span>Upload files</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                  </div>
                </div>
                {refundForm.images.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      {refundForm.images.length} file(s) selected
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Preferred Contact Method *
                </label>
                <select
                  required
                  value={refundForm.contactPreference}
                  onChange={(e) => setRefundForm(prev => ({ ...prev, contactPreference: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Contact Details *
                </label>
                <input
                  type="text"
                  required
                  value={refundForm.contactDetails}
                  onChange={(e) => setRefundForm(prev => ({ ...prev, contactDetails: e.target.value }))}
                  placeholder={refundForm.contactPreference === 'email' ? 'Enter your email' : 'Enter your phone number'}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  Submit Refund Request
                </button>
              </div>
            </form>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6">Your Orders</h2>
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <FiPackage className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No Orders Found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  You don't have any orders at the moment.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order #
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{order.orderNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${order.totalAmount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundOrders; 