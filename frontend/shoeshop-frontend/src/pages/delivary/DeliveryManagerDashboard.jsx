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
  FiUserPlus,
  FiPhone,
  FiMail,
  FiCreditCard,
  FiDollarSign,
  FiInfo,
  FiTrash2,
  FiUser,
  FiHash
} from "react-icons/fi";
import axios from "axios";
import { toast } from "react-toastify";
import DeliveryManagerLogin from "./DeliveryManagerLogin";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Header from './Header';
import Footer from './Footer';

// Add animation styles
const styles = `
  @keyframes fade-in-out {
    0% { opacity: 0; transform: translateY(-1rem); }
    10% { opacity: 1; transform: translateY(0); }
    90% { opacity: 1; transform: translateY(0); }
    100% { opacity: 0; transform: translateY(-1rem); }
  }
  .animate-fade-in-out {
    animation: fade-in-out 3s ease-in-out forwards;
  }
`;

// Add styles to document head
if (!document.getElementById('dashboard-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'dashboard-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

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
  const [showDeliveryPersonsModal, setShowDeliveryPersonsModal] = useState(false);
  const [showDeliveryDetails, setShowDeliveryDetails] = useState(false);
  const [selectedDeliveryDetails, setSelectedDeliveryDetails] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deliveryDetails, setDeliveryDetails] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [profile, setProfile] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [refundRequests, setRefundRequests] = useState([]);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [showRefundDetailsModal, setShowRefundDetailsModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('deliveryManagerToken');
    if (!token) {
      navigate('/delivery-login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        await Promise.all([fetchOrders(), fetchDeliveryPersons(), fetchProfile(), fetchRefundRequests()]);
        fetchAllDeliveryDetails();
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
      const response = await axios.get('http://localhost:5000/api/delivery/manager/delivery-persons', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const deliveryPersonsData = response.data.deliveryPersons || [];
      setDeliveryPersons(deliveryPersonsData);
      
      // Update total drivers count in stats
      setDeliveryStats(prev => ({
        ...prev,
        totalDrivers: deliveryPersonsData.length
      }));
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
      if (!deliveryPersonId) {
        toast.warning('Please select a delivery person');
        return;
      }

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

      console.log('Assigning order:', orderId, 'to delivery person:', deliveryPersonId);

      // Assign delivery person to order
      const response = await axios.put(
        `http://localhost:5000/api/delivery/manager/orders/${orderId}/assign`,
        { deliveryPersonId },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        // Update orders state immediately
        setOrders(prevOrders => prevOrders.map(order => {
          if (order._id === orderId) {
            return {
              ...order,
              deliveryPerson: {
                _id: selectedPerson._id,
                name: selectedPerson.name,
                email: selectedPerson.email,
                phone: selectedPerson.phone
              },
              deliveryStatus: 'processing'
            };
          }
          return order;
        }));

        toast.success('Delivery person assigned successfully');
        // Refresh the orders list to get updated data
        await fetchOrders();
      } else {
        throw new Error(response.data.message || 'Failed to assign delivery person');
      }
    } catch (error) {
      console.error('Error assigning delivery person:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/delivery-login');
      } else {
        toast.error(error.response?.data?.message || 'Failed to assign delivery person. Please try again.');
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
        licenseNumber: '',
        password: ''
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

  const handleDeleteDeliveryPerson = async (deliveryPersonId) => {
    try {
      setIsDeleting(true);
      const token = localStorage.getItem('deliveryManagerToken');
      
      if (!token) {
        toast.error('Authentication required. Please login again.');
        navigate('/delivery-login');
        return;
      }

      // Check if the delivery person has active orders
      const activeOrders = orders.filter(
        order => order.deliveryPerson?._id === deliveryPersonId && 
        order.deliveryStatus !== 'delivered' && 
        order.deliveryStatus !== 'cancelled'
      );

      if (activeOrders.length > 0) {
        toast.error('Cannot delete delivery person with active orders');
        return;
      }

      // Make the delete request
      const response = await axios.delete(
        `http://localhost:5000/api/delivery/manager/delivery-persons/${deliveryPersonId}`,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      if (response.data.success) {
        // Update the local state to remove the deleted delivery person
        setDeliveryPersons(prevPersons => 
          prevPersons.filter(person => person._id !== deliveryPersonId)
        );

        // Update delivery stats
        setDeliveryStats(prev => ({
          ...prev,
          totalDrivers: prev.totalDrivers - 1
        }));

        toast.success('Delivery person deleted successfully');
        setShowDeliveryPersonsModal(false); // Close the modal after successful deletion
      } else {
        throw new Error(response.data.message || 'Failed to delete delivery person');
      }
    } catch (error) {
      console.error('Error deleting delivery person:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete delivery person';
      toast.error(errorMessage);
      
      if (error.response?.status === 401) {
        navigate('/delivery-login');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const DeliveryPersonsModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-[9999] backdrop-blur-sm">
      <div className="relative bg-white p-8 rounded-xl shadow-2xl max-w-6xl w-full mx-4 z-[10000]">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Delivery Persons</h2>
            <p className="text-gray-500 mt-1">Manage your delivery team members</p>
          </div>
          <button
            onClick={() => setShowDeliveryPersonsModal(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <FiX className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Contact Info
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      License
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Orders
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {deliveryPersons.map((person) => {
                    const personOrders = orders.filter(order => order.deliveryPerson?._id === person._id);
                    const activeOrders = personOrders.filter(order => order.deliveryStatus !== 'delivered' && order.deliveryStatus !== 'cancelled');
                    
                    return (
                      <tr key={person._id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                <span className="text-indigo-600 font-semibold text-lg">
                                  {person.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{person.name}</div>
                              <div className="text-sm text-gray-500">{person.email}</div>
                              <div className="text-sm text-gray-500">{person.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{person.vehicleNumber}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{person.licenseNumber}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            person.status === 'active' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            <span className={`h-2 w-2 mr-2 rounded-full ${
                              person.status === 'active' 
                                ? 'bg-green-400'
                                : 'bg-red-400'
                            }`}></span>
                            {person.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="text-sm font-medium text-gray-900">
                              Active: {activeOrders.length}
                            </div>
                            <div className="text-sm text-gray-500">
                              Total: {personOrders.length}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this delivery person?')) {
                                handleDeleteDeliveryPerson(person._id);
                              }
                            }}
                            disabled={isDeleting || activeOrders.length > 0}
                            className={`inline-flex items-center px-3 py-1 border border-transparent rounded-md ${
                              activeOrders.length > 0
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : isDeleting
                                  ? 'bg-red-100 text-red-400 cursor-wait'
                                  : 'bg-red-50 text-red-600 hover:bg-red-100'
                            }`}
                            title={activeOrders.length > 0 ? "Cannot delete: Has active orders" : "Delete delivery person"}
                          >
                            <FiTrash2 className={`w-4 h-4 mr-1 ${isDeleting ? 'animate-spin' : ''}`} />
                            {isDeleting ? 'Deleting...' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Update the fetchDeliveryDetails function
  const fetchDeliveryDetails = async (orderId) => {
    try {
      console.log('Fetching delivery details for order:', orderId);
      const token = localStorage.getItem('deliveryManagerToken');
      if (!token) {
        toast.error('Authentication required. Please login again.');
        return;
      }
      // Use the manager-specific endpoint
      const response = await axios.get(
        `http://localhost:5000/api/delivery/manager/orders/${orderId}/details`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('Delivery details response:', response.data);
      if (response.data && response.data.details) {
        const details = response.data.details;
        setSelectedDeliveryDetails({
          deliveryCost: details.deliveryCost || 0,
          mileage: details.mileage || 0,
          petrolCost: details.petrolCost || 0,
          timeSpent: details.timeSpent || 0,
          additionalNotes: details.additionalNotes || '',
          submittedAt: details.submittedAt || new Date().toISOString()
        });
        setShowDeliveryDetails(true);
      } else {
        toast.info('No delivery details available for this order');
      }
    } catch (error) {
      console.error('Error fetching delivery details:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('deliveryManagerToken');
        navigate('/delivery-manager-login');
      } else if (error.response?.status === 404) {
        toast.info('No delivery details found for this order yet');
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to fetch delivery details';
        toast.error(errorMessage);
      }
    }
  };

  // Add the DeliveryDetailsModal component
  const DeliveryDetailsModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-[9999] backdrop-blur-sm">
      <div className="relative bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full m-4 z-[10000]">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Delivery Details</h2>
          <button
            onClick={() => setShowDeliveryDetails(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>
        {selectedDeliveryDetails ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                  <FiDollarSign className="text-blue-500 w-5 h-5" />
                <div>
                  <p className="text-sm text-gray-500">Delivery Cost</p>
                    <p className="font-medium text-gray-900">Rs. {selectedDeliveryDetails.deliveryCost}</p>
                </div>
              </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                  <FiTruck className="text-blue-500 w-5 h-5" />
                <div>
                  <p className="text-sm text-gray-500">Mileage</p>
                    <p className="font-medium text-gray-900">{selectedDeliveryDetails.mileage} km</p>
                </div>
              </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                  <FiDroplet className="text-blue-500 w-5 h-5" />
                <div>
                  <p className="text-sm text-gray-500">Petrol Cost</p>
                    <p className="font-medium text-gray-900">Rs. {selectedDeliveryDetails.petrolCost}</p>
                </div>
              </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                  <FiClock className="text-blue-500 w-5 h-5" />
                <div>
                  <p className="text-sm text-gray-500">Time Spent</p>
                    <p className="font-medium text-gray-900">{selectedDeliveryDetails.timeSpent} hours</p>
                  </div>
                </div>
              </div>
            </div>
            {selectedDeliveryDetails.additionalNotes && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">Additional Notes</p>
                <p className="text-gray-700">{selectedDeliveryDetails.additionalNotes}</p>
              </div>
            )}
            {selectedDeliveryDetails.submittedAt && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">Submitted At</p>
                <p className="text-gray-700">
                  {new Date(selectedDeliveryDetails.submittedAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <FiInfo className="w-full h-full" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No Details Available</h3>
            <p className="mt-1 text-sm text-gray-500">No delivery details have been submitted for this order yet.</p>
          </div>
        )}
        <div className="mt-8 flex justify-end">
          <button
            onClick={() => setShowDeliveryDetails(false)}
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  // Fetch all delivery details for the manager
  const fetchAllDeliveryDetails = async () => {
    try {
      const token = localStorage.getItem('deliveryManagerToken');
      if (!token) return;
      const response = await axios.get('http://localhost:5000/api/delivery/manager/delivery-details', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeliveryDetails(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching all delivery details:', error);
      toast.error('Failed to fetch delivery details history.');
    }
  };

  // Filtered delivery details by search term
  const filteredDeliveryDetails = deliveryDetails.filter(detail => {
    const name = typeof detail.deliveryPersonId === 'object' ? detail.deliveryPersonId.name : detail.deliveryPersonId;
    return name && name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // PDF generation function
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    // Title
    doc.setFontSize(18);
    doc.text('Delivery Details Report', doc.internal.pageSize.getWidth() / 2, 18, { align: 'center' });
    let y = 28;
    // Subtitle for search
    if (searchTerm.trim()) {
      doc.setFontSize(12);
      doc.setTextColor(60, 60, 60);
      doc.text(`Filtered by Delivery Person: ${searchTerm}`, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
      y += 8;
    }
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const tableColumn = [
      'Order ID',
      'Delivery Person',
      'Delivery Cost',
      'Mileage',
      'Petrol Cost',
      'Time Spent',
      'Submitted At'
    ];
    const tableRows = filteredDeliveryDetails.map(detail => [
      typeof detail.orderId === 'object'
        ? detail.orderId.orderNumber || detail.orderId._id || '-'
        : detail.orderId || '-',
      typeof detail.deliveryPersonId === 'object'
        ? detail.deliveryPersonId.name || detail.deliveryPersonId._id || '-'
        : detail.deliveryPersonId || '-',
      `Rs. ${detail.deliveryCost?.toFixed(2) ?? '-'}`,
      `${detail.mileage?.toFixed(1) ?? '-'} km`,
      `Rs. ${detail.petrolCost?.toFixed(2) ?? '-'}`,
      `${detail.timeSpent?.toFixed(1) ?? '-'} hours`,
      detail.submittedAt ? new Date(detail.submittedAt).toLocaleString() : '-'
    ]);
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: y + 4,
      styles: {
        fontSize: 10,
        cellPadding: 3,
        halign: 'center',
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      rowPageBreak: 'avoid',
      margin: { left: 10, right: 10 },
    });
    doc.save('delivery-details-report.pdf');
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('deliveryManagerToken');
      const response = await axios.get('http://localhost:5000/api/delivery-manager/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data) {
        setProfile(response.data);
        console.log('Profile data:', response.data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('deliveryManagerToken');
        navigate('/delivery-login');
      } else {
        toast.error('Failed to fetch profile');
      }
    }
  };

  const fetchRefundRequests = async () => {
    try {
      const token = localStorage.getItem('deliveryManagerToken');
      if (!token) {
        toast.error('Please login to view refund requests');
        navigate('/delivery-login');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/refunds/all', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.success) {
        setRefundRequests(response.data.refunds || []);
        setShowSuccessMessage(true);
        setSuccessMessage('Refund requests loaded successfully');
        setTimeout(() => setShowSuccessMessage(false), 3000);
      } else {
        console.warn('No refunds found or invalid response format:', response.data);
        setRefundRequests([]);
      }
    } catch (error) {
      console.error('Error fetching refund requests:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch refund requests';
      toast.error(errorMessage);
      
      if (error.response?.status === 401) {
        localStorage.removeItem('deliveryManagerToken');
        navigate('/delivery-login');
      }
    }
  };

  const handleRefundStatus = async (refundId, status) => {
    try {
      const token = localStorage.getItem('deliveryManagerToken');
      if (!token) {
        toast.error('Please login to update refund status');
        navigate('/delivery-login');
        return;
      }

      const response = await axios.put(
        `http://localhost:5000/api/refunds/${refundId}/status`,
        { status },
        { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );
      
      if (response.data.success) {
        toast.success(`Refund request ${status} successfully`);
        await fetchRefundRequests(); // Refresh the list
        setShowRefundDetailsModal(false);
      }
    } catch (error) {
      console.error('Error updating refund status:', error);
      const errorMessage = error.response?.data?.message || `Failed to ${status} refund request`;
      toast.error(errorMessage);
      
      if (error.response?.status === 401) {
        localStorage.removeItem('deliveryManagerToken');
        navigate('/delivery-login');
      }
    }
  };

  const RefundDetailsModal = () => {
    if (!selectedRefund) return null;

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-[9999] backdrop-blur-sm">
        <div className="relative bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full m-4 z-[10000]">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Refund Request Details</h2>
            <button
              onClick={() => setShowRefundDetailsModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Order Number</p>
                <p className="font-medium text-gray-900">#{selectedRefund.orderNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  selectedRefund.status === 'approved' ? 'bg-green-100 text-green-800' :
                  selectedRefund.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {selectedRefund.status}
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500">Reason for Refund</p>
              <p className="font-medium text-gray-900">{selectedRefund.reason}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Description</p>
              <p className="font-medium text-gray-900">{selectedRefund.description}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Contact Information</p>
              <p className="font-medium text-gray-900">
                {selectedRefund.contactPreference}: {selectedRefund.contactDetails}
              </p>
            </div>

            {selectedRefund.images && selectedRefund.images.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Attached Images</p>
                <div className="grid grid-cols-3 gap-4">
                  {selectedRefund.images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={`http://localhost:5000/${image}`}
                        alt={`Refund evidence ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <a
                        href={`http://localhost:5000/${image}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity duration-200 rounded-lg"
                      >
                        <span className="text-white text-sm">View Full Size</span>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedRefund.status === 'pending' && (
              <div className="flex space-x-4 mt-6">
                <button
                  onClick={() => {
                    handleRefundStatus(selectedRefund._id, 'approved');
                    setShowRefundDetailsModal(false);
                  }}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
                >
                  Approve Refund
                </button>
                <button
                  onClick={() => {
                    handleRefundStatus(selectedRefund._id, 'rejected');
                    setShowRefundDetailsModal(false);
                  }}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700"
                >
                  Reject Refund
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header userName={profile?.name || "Manager"} onLogout={handleLogout} />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Delivery Management</h1>
            <p className="mt-2 text-gray-600">Welcome back, <span className="font-semibold text-indigo-600">{profile?.name}</span></p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <FiUser className="text-lg" />
              {showProfile ? 'Hide Profile' : 'View Profile'}
            </button>
            <button
              onClick={() => setShowDeliveryPersonsModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <FiUsers className="text-lg" />
              View Delivery Persons
            </button>
            <button
              onClick={fetchOrders}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              <FiRefreshCw className="text-lg" />
              Refresh Data
            </button>
            <button
              onClick={() => setShowRefundModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <FiDollarSign className="text-lg" />
              View Refund Requests
            </button>
          </div>
        </div>

        {/* Profile Section */}
        {showProfile && profile && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
              <button
                onClick={() => setShowProfile(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <FiUser className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium text-gray-900">{profile.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <FiMail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{profile.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <FiPhone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone Number</p>
                  <p className="font-medium text-gray-900">{profile.phoneNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <FiMap className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Assigned Area</p>
                  <p className="font-medium text-gray-900">{profile.assignedArea}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <FiCalendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Joined Date</p>
                  <p className="font-medium text-gray-900">
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <FiCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium text-gray-900">
                    {profile.isActive ? (
                      <span className="text-green-600">Active</span>
                    ) : (
                      <span className="text-red-600">Inactive</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

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
          <div className="relative">
            <div className="overflow-x-auto max-h-[500px] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <table className="min-w-full divide-y divide-gray-200 table-fixed">
                <thead className="bg-gray-50 sticky top-0 z-[2] shadow-sm">
                <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50">Order ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50">Customer</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50">Address</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50">Delivery Person</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50">Total</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50">Actions</th>
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
                          title="View Order Details"
                        >
                          <FiClipboard className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            if (!order._id) {
                                toast.error('Invalid order ID');
                                return;
                            }
                            fetchDeliveryDetails(order._id);
                          }}
                          className="text-green-600 hover:text-green-900"
                          title="View Delivery Details"
                          disabled={!order._id}
                        >
                          <FiInfo className="w-5 h-5" />
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

        {/* Delivery Details History Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mt-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between px-6 py-4 border-b border-gray-200 gap-4 bg-white">
            <h2 className="text-xl font-semibold text-gray-800">Delivery Details History</h2>
            <div className="flex flex-col md:flex-row md:items-center gap-2 w-full md:w-auto">
              <input
                type="text"
                placeholder="Search by Delivery Person Name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 w-full md:w-64"
              />
              <button
                onClick={handleDownloadPDF}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-semibold shadow-sm whitespace-nowrap"
              >
                Download PDF
              </button>
            </div>
          </div>
          <div className="relative">
            <div className="overflow-x-auto" style={{
              maxHeight: 'calc(100vh - 400px)',
              minHeight: '200px'
            }}>
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-white">
                    <th scope="col" className="sticky top-0 px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-white shadow-sm z-[1]">
                      Order ID
                    </th>
                    <th scope="col" className="sticky top-0 px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-white shadow-sm z-[1]">
                      Delivery Person
                    </th>
                    <th scope="col" className="sticky top-0 px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-white shadow-sm z-[1]">
                      Delivery Cost
                    </th>
                    <th scope="col" className="sticky top-0 px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-white shadow-sm z-[1]">
                      Mileage
                    </th>
                    <th scope="col" className="sticky top-0 px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-white shadow-sm z-[1]">
                      Petrol Cost
                    </th>
                    <th scope="col" className="sticky top-0 px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-white shadow-sm z-[1]">
                      Time Spent
                    </th>
                    <th scope="col" className="sticky top-0 px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-white shadow-sm z-[1]">
                      Submitted At
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDeliveryDetails.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500 bg-gray-50">
                        <div className="flex flex-col items-center justify-center">
                          <FiPackage className="w-8 h-8 mb-2 text-gray-400" />
                          <p className="text-sm font-medium">No delivery details found</p>
                          <p className="text-xs text-gray-400">Try adjusting your search criteria</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredDeliveryDetails.map((detail, idx) => (
                      <tr key={detail._id || idx} className={idx % 2 === 0 ? 'bg-white hover:bg-blue-50' : 'bg-gray-50 hover:bg-blue-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {typeof detail.orderId === 'object'
                            ? detail.orderId.orderNumber || detail.orderId._id || '-'
                            : detail.orderId || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {typeof detail.deliveryPersonId === 'object'
                            ? detail.deliveryPersonId.name || detail.deliveryPersonId._id || '-'
                            : detail.deliveryPersonId || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Rs. {detail.deliveryCost?.toFixed(2) ?? '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {detail.mileage?.toFixed(1) ?? '-'} km
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Rs. {detail.petrolCost?.toFixed(2) ?? '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {detail.timeSpent?.toFixed(1) ?? '-'} hours
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {detail.submittedAt ? new Date(detail.submittedAt).toLocaleString() : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-[9999] backdrop-blur-sm">
          <div className="relative bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full m-4 z-[10000]">
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-[9999] backdrop-blur-sm">
          <div className="relative bg-white p-8 rounded-lg shadow-xl max-w-md w-full m-4 z-[10000]">
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

      {/* Delivery Persons Modal */}
      {showDeliveryPersonsModal && <DeliveryPersonsModal />}

      {/* Add the delivery details modal */}
      {showDeliveryDetails && <DeliveryDetailsModal />}

      {/* Refund Requests Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-[9999] backdrop-blur-sm">
          <div className="relative bg-white p-8 rounded-lg shadow-xl max-w-5xl min-w-[350px] w-full m-4 z-[10000]" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><FiDollarSign className="text-red-500" /> Refund Requests</h2>
                <p className="text-sm text-gray-500 mt-1">Manage customer refund requests</p>
              </div>
              <button
                onClick={() => setShowRefundModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : refundRequests.length === 0 ? (
              <div className="text-center py-8">
                <FiPackage className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No Refund Requests</h3>
                <p className="mt-1 text-sm text-gray-500">
                  There are no refund requests at the moment.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                        <span className="inline-flex items-center gap-1"><FiClipboard className="inline mr-1" />Order #</span>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">
                        <span className="inline-flex items-center gap-1"><FiInfo className="inline mr-1" />Reason</span>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                        <span className="inline-flex items-center gap-1"><FiInfo className="inline mr-1" />Description</span>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                        <span className="inline-flex items-center gap-1"><FiInfo className="inline mr-1" />Status</span>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[220px]">
                        <span className="inline-flex items-center gap-1"><FiMail className="inline mr-1" />Contact</span>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                        <span className="inline-flex items-center gap-1"><FiPackage className="inline mr-1" />Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {refundRequests.map((refund) => {
                      // Fallback for order number
                      let orderNumber = refund.orderNumber;
                      if (!orderNumber) {
                        if (typeof refund.orderId === 'object' && refund.orderId._id) {
                          orderNumber = refund.orderId._id.substring(0, 8).toUpperCase();
                        } else if (typeof refund.orderId === 'string') {
                          orderNumber = refund.orderId.substring(0, 8).toUpperCase();
                        } else {
                          orderNumber = 'N/A';
                        }
                      }
                      return (
                        <tr key={refund._id} className="hover:bg-gray-100 transition-colors" style={{ minHeight: '56px', height: '56px' }}>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 min-w-[120px] font-semibold">
                            <span title={typeof refund.orderId === 'object' ? refund.orderId._id || refund.orderId : refund.orderId} className="cursor-help underline decoration-dotted">
                              {orderNumber}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 min-w-[140px]">{refund.reason}</td>
                          <td className="px-4 py-4 text-sm text-gray-900 min-w-[200px] max-w-[250px] truncate" title={refund.description}>{refund.description.length > 40 ? refund.description.slice(0, 40) + '...' : refund.description}</td>
                          <td className="px-4 py-4 whitespace-nowrap min-w-[100px]">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              refund.status === 'approved' ? 'bg-green-100 text-green-800' :
                              refund.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {refund.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-normal break-words text-sm text-gray-900 min-w-[220px] max-w-[300px]">
                            <span className="inline-flex items-center gap-1">
                              {refund.contactPreference === 'email' ? <FiMail className="text-blue-500 mr-1" /> : <FiPhone className="text-green-500 mr-1" />}
                              <span className="font-semibold capitalize mr-1">{refund.contactPreference}:</span>
                              {refund.contactPreference === 'email' ? (
                                <a href={`mailto:${refund.contactDetails}`} className="text-blue-700 underline break-all">{refund.contactDetails}</a>
                              ) : (
                                <a href={`tel:${refund.contactDetails}`} className="text-green-700 underline break-all">{refund.contactDetails}</a>
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium min-w-[100px]">
                            <button
                              onClick={() => {
                                setSelectedRefund(refund);
                                setShowRefundDetailsModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900 underline"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {showRefundDetailsModal && <RefundDetailsModal />}

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in-out">
          {successMessage}
        </div>
      )}
    </div>
  );
};

export default DeliveryManagerDashboard; 