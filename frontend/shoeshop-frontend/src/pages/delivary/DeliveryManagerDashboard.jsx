import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiPackage, 
  FiTruck, 
  FiMap, 
  FiCalendar, 
  FiUsers, 
  FiClipboard, 
  FiRefreshCw, 
  FiCheck, 
  FiX, 
  FiAlertCircle,
  FiUserPlus
} from "react-icons/fi";
import axios from "axios";
import { toast } from "react-toastify";
import DeliveryManagerLogin from "./DeliveryManagerLogin";

const DeliveryManagerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [orders, setOrders] = useState([]);
  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const [deliveryStats, setDeliveryStats] = useState({
    pendingDeliveries: 0,
    inTransit: 0,
    completed: 0,
    cancelled: 0,
    totalDrivers: 0,
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAddDeliveryPersonModal, setShowAddDeliveryPersonModal] = useState(false);
  const [newDeliveryPerson, setNewDeliveryPerson] = useState({
    name: '',
    email: '',
    phone: '',
    vehicleNumber: '',
    licenseNumber: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('deliveryManagerToken');
    if (!token) {
      navigate('/delivery-login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        await Promise.all([fetchOrders(), fetchDeliveryPersons()]);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data. Please try again.');
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const fetchDeliveryPersons = async () => {
    try {
      const token = localStorage.getItem('deliveryManagerToken');
      const response = await axios.get('http://localhost:5000/api/delivery/delivery-persons', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeliveryPersons(response.data.deliveryPersons || []);
    } catch (error) {
      console.error('Error fetching delivery persons:', error);
      toast.error('Failed to fetch delivery persons. Please check your connection.');
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('deliveryManagerToken');
      const response = await axios.get('http://localhost:5000/api/orders/all', {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Raw orders data:', response.data);

      // Transform the orders data to match the frontend structure
      const transformedOrders = Array.isArray(response.data) ? response.data.map(order => {
        // Calculate individual item prices if not available
        const items = order.items.map(item => {
          const itemPrice = item.price || (order.totalAmount / order.items.reduce((sum, i) => sum + i.quantity, 0));
          return {
            product: {
              name: `${item.BrandName} ${item.ModelName}`,
            },
            quantity: item.quantity,
            imageUrl: item.imageUrl || null,
            price: itemPrice // Price per item
          };
        });

        return {
          _id: order._id,
          customerName: `${order.firstName} ${order.lastName}`,
          customerEmail: order.email,
          shippingAddress: order.shippingAddress,
          deliveryStatus: order.deliveryStatus || 'processing',
          totalPrice: order.totalAmount,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          deliveryPerson: order.deliveryPerson || null,
          items: items
        };
      }) : [];

      console.log('Transformed orders:', transformedOrders);
      setOrders(transformedOrders);
      
      // Calculate delivery stats
      const stats = {
        pendingDeliveries: transformedOrders.filter(order => order.deliveryStatus === 'processing' || !order.deliveryStatus).length,
        inTransit: transformedOrders.filter(order => order.deliveryStatus === 'pickedup').length,
        completed: transformedOrders.filter(order => order.deliveryStatus === 'delivered').length,
        cancelled: transformedOrders.filter(order => order.deliveryStatus === 'cancelled').length,
        totalDrivers: deliveryPersons.length,
      };
      
      setDeliveryStats(stats);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders. Please check your connection.');
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('deliveryManagerToken');
      await axios.put(
        `http://localhost:5000/api/orders/${orderId}`,
        { deliveryStatus: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update orders state immediately
      setOrders(prevOrders => prevOrders.map(order => {
        if (order._id === orderId) {
          return {
            ...order,
            deliveryStatus: newStatus
          };
        }
        return order;
      }));

      // Update delivery stats immediately
      setDeliveryStats(prevStats => {
        const updatedOrders = orders.map(order => 
          order._id === orderId ? { ...order, deliveryStatus: newStatus } : order
        );
        
        return {
          pendingDeliveries: updatedOrders.filter(order => order.deliveryStatus === 'processing' || !order.deliveryStatus).length,
          inTransit: updatedOrders.filter(order => order.deliveryStatus === 'pickedup').length,
          completed: updatedOrders.filter(order => order.deliveryStatus === 'delivered').length,
          cancelled: updatedOrders.filter(order => order.deliveryStatus === 'cancelled').length,
          totalDrivers: prevStats.totalDrivers
        };
      });

      toast.success(`Order status updated to ${newStatus}`);
      setShowStatusModal(false);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update status. Please try again.');
    }
  };

  const handleAssignDeliveryPerson = async (orderId, deliveryPersonId) => {
    try {
      const token = localStorage.getItem('deliveryManagerToken');
      if (!token) {
        navigate('/delivery-login');
        return;
      }

      // Find the selected delivery person from the deliveryPersons array
      const selectedPerson = deliveryPersons.find(person => person._id === deliveryPersonId);
      if (!selectedPerson) {
        toast.error('Selected delivery person not found');
        return;
      }

      // Assign delivery person to order
      await axios.put(
        `http://localhost:5000/api/delivery/orders/${orderId}/assign`,
        { 
          deliveryPersonId,
          deliveryPerson: {
            _id: selectedPerson._id,
            name: selectedPerson.name,
            email: selectedPerson.email,
            phone: selectedPerson.phone
          }
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update orders state immediately
      setOrders(prevOrders => prevOrders.map(order => {
        if (order._id === orderId) {
          return {
            ...order,
            deliveryPerson: selectedPerson
          };
        }
        return order;
      }));

      toast.success('Delivery person assigned successfully');
    } catch (error) {
      console.error('Error assigning delivery person:', error);
      if (error.response?.status === 401) {
        navigate('/delivery-login');
      } else {
        toast.error('Failed to assign delivery person. Please try again.');
      }
    }
  };

  const handleAddDeliveryPerson = async (e) => {
    e.preventDefault();
    try {
      // Validate all required fields
      if (!newDeliveryPerson.name || !newDeliveryPerson.email || 
          !newDeliveryPerson.phone || !newDeliveryPerson.vehicleNumber || 
          !newDeliveryPerson.licenseNumber) {
        toast.error('All fields are required');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newDeliveryPerson.email)) {
        toast.error('Please enter a valid email address');
        return;
      }

      // Validate phone number (basic validation)
      if (newDeliveryPerson.phone.length < 10) {
        toast.error('Please enter a valid phone number');
        return;
      }

      const token = localStorage.getItem('deliveryManagerToken');
      if (!token) {
        navigate('/delivery-login');
        return;
      }

      // Create delivery person
      const response = await axios.post(
        'http://localhost:5000/api/delivery/delivery-persons',
        newDeliveryPerson,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Send welcome email
      try {
        await axios.post(
          'http://localhost:5000/api/delivery/send-welcome-email',
          {
            email: newDeliveryPerson.email,
            name: newDeliveryPerson.name,
            phone: newDeliveryPerson.phone
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
        // Don't fail the whole operation if email fails
      }

      toast.success('Delivery person added successfully');
      setShowAddDeliveryPersonModal(false);
      setNewDeliveryPerson({
        name: '',
        email: '',
        phone: '',
        vehicleNumber: '',
        licenseNumber: ''
      });
      
      // Refresh delivery persons list
      fetchDeliveryPersons();
    } catch (error) {
      console.error('Error adding delivery person:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add delivery person. Please try again.';
      toast.error(errorMessage);
      
      if (error.response?.status === 401) {
        navigate('/delivery-login');
      }
    }
  };

  const filteredOrders = activeTab === 'all' 
    ? orders 
    : orders.filter(order => {
        switch(activeTab) {
          case 'processing':
            return order.deliveryStatus === 'processing' || !order.deliveryStatus;
          case 'pickedup':
            return order.deliveryStatus === 'pickedup';
          case 'delivered':
            return order.deliveryStatus === 'delivered';
          default:
            return true;
        }
      });

  const getStatusColor = (status) => {
    switch (status) {
      case 'processing':
      case undefined:
      case null:
        return 'bg-yellow-100 text-yellow-800';
      case 'pickedup':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('deliveryManagerToken');
    navigate('/delivery-login');
  };

  // Add function to fetch orders for a specific delivery person
  const fetchDeliveryPersonOrders = async (deliveryPersonId) => {
    try {
      const token = localStorage.getItem('deliveryManagerToken');
      const response = await axios.get(
        `http://localhost:5000/api/delivery/delivery-persons/${deliveryPersonId}/orders`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error fetching delivery person orders:', error);
      toast.error('Failed to fetch delivery person orders.');
      return [];
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Delivery Management</h1>
            <p className="mt-2 text-gray-600">Manage orders and delivery status</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAddDeliveryPersonModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <FiUserPlus className="text-lg" />
              Add Delivery Person
            </button>
            <button
              onClick={fetchOrders}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              <FiRefreshCw className="text-lg" />
              Refresh Data
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <FiPackage size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">{deliveryStats.pendingDeliveries}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <FiTruck size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">In Transit</p>
                <p className="text-2xl font-semibold text-gray-900">{deliveryStats.inTransit}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <FiCheck size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">{deliveryStats.completed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100 text-red-600">
                <FiX size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Cancelled</p>
                <p className="text-2xl font-semibold text-gray-900">{deliveryStats.cancelled}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <FiUsers size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="text-2xl font-semibold text-gray-900">{orders.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Status Tabs */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex space-x-4 mb-6">
            {['all', 'processing', 'pickedup', 'delivered'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg ${
                  activeTab === tab
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Orders Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Person</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order._id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.customerName}<br/>
                      <span className="text-gray-500">{order.customerEmail}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{order.shippingAddress}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.deliveryStatus)}`}>
                        {(order.deliveryStatus || 'processing').charAt(0).toUpperCase() + (order.deliveryStatus || 'processing').slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select 
                        value={order.deliveryPerson?._id || ''}
                        onChange={(e) => handleAssignDeliveryPerson(order._id, e.target.value)}
                        className="block w-full p-2 rounded-md border-gray-300 text-gray-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      >
                        <option value="">Select Delivery Person</option>
                        {deliveryPersons.map((person) => (
                          <option key={person._id} value={person._id}>
                            {person.name}
                          </option>
                        ))}
                      </select>
                      {order.deliveryPerson && (
                        <div className="mt-1 text-sm text-gray-500">
                          Assigned: {order.deliveryPerson.name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Rs.{order.totalPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowStatusModal(true);
                          }}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Update Status"
                        >
                          <FiRefreshCw className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowDetailsModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <FiClipboard className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">Order Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="font-semibold">Order Information</p>
                <p>Order ID: {selectedOrder._id}</p>
                <p>Status: <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedOrder.deliveryStatus)}`}>
                  {(selectedOrder.deliveryStatus || 'processing').charAt(0).toUpperCase() + (selectedOrder.deliveryStatus || 'processing').slice(1)}
                </span></p>
                <p>Total: Rs.{selectedOrder.totalPrice.toFixed(2)}</p>
                <p>Payment Method: {selectedOrder.paymentMethod}</p>
              </div>
              <div>
                <p className="font-semibold">Customer Information</p>
                <p>Name: {selectedOrder.customerName}</p>
                <p>Email: {selectedOrder.customerEmail}</p>
                <p>Shipping Address: {selectedOrder.shippingAddress}</p>
              </div>
            </div>
            <div>
              <p className="font-semibold mb-2">Order Items</p>
              <div className="space-y-2">
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt={item.product.name} className="w-12 h-12 object-cover rounded" />
                      )}
                      <span>{item.product.name} x {item.quantity}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Price: Rs.{(item.price).toFixed(2)}</div>
                      <div className="font-medium">Total: Rs.{(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between font-semibold">
                  <span>Total Amount:</span>
                  <span>Rs.{selectedOrder.totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Update Order Status</h2>
            <div className="mb-4">
              <p><strong>Order ID:</strong> {selectedOrder._id}</p>
              <p><strong>Customer:</strong> {selectedOrder.customerName}</p>
              <p><strong>Current Status:</strong> {(selectedOrder.deliveryStatus || 'processing').charAt(0).toUpperCase() + (selectedOrder.deliveryStatus || 'processing').slice(1)}</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => handleStatusChange(selectedOrder._id, 'processing')}
                className="w-full bg-yellow-100 text-yellow-800 py-2 px-4 rounded hover:bg-yellow-200"
              >
                Mark as Processing
              </button>
              <button
                onClick={() => handleStatusChange(selectedOrder._id, 'pickedup')}
                className="w-full bg-blue-100 text-blue-800 py-2 px-4 rounded hover:bg-blue-200"
              >
                Mark as Picked Up
              </button>
              <button
                onClick={() => handleStatusChange(selectedOrder._id, 'delivered')}
                className="w-full bg-green-100 text-green-800 py-2 px-4 rounded hover:bg-green-200"
              >
                Mark as Delivered
              </button>
              <button
                onClick={() => handleStatusChange(selectedOrder._id, 'cancelled')}
                className="w-full bg-red-100 text-red-800 py-2 px-4 rounded hover:bg-red-200"
              >
                Mark as Cancelled
              </button>
              <button
                onClick={() => setShowStatusModal(false)}
                className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 mt-4"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Delivery Person Modal */}
      {showAddDeliveryPersonModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">Add New Delivery Person</h2>
              <button
                onClick={() => setShowAddDeliveryPersonModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddDeliveryPerson} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={newDeliveryPerson.name}
                  onChange={(e) => setNewDeliveryPerson({...newDeliveryPerson, name: e.target.value})}
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={newDeliveryPerson.email}
                  onChange={(e) => setNewDeliveryPerson({...newDeliveryPerson, email: e.target.value})}
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  value={newDeliveryPerson.phone}
                  onChange={(e) => setNewDeliveryPerson({...newDeliveryPerson, phone: e.target.value})}
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Vehicle Number</label>
                <input
                  type="text"
                  value={newDeliveryPerson.vehicleNumber}
                  onChange={(e) => setNewDeliveryPerson({...newDeliveryPerson, vehicleNumber: e.target.value})}
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">License Number</label>
                <input
                  type="text"
                  value={newDeliveryPerson.licenseNumber}
                  onChange={(e) => setNewDeliveryPerson({...newDeliveryPerson, licenseNumber: e.target.value})}
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddDeliveryPersonModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Delivery Person
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryManagerDashboard; 