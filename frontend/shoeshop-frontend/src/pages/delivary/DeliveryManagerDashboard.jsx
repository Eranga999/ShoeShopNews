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
  FiTrash2
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
  const [showDeliveryPersonsModal, setShowDeliveryPersonsModal] = useState(false);
  const [showDeliveryDetails, setShowDeliveryDetails] = useState(false);
  const [selectedDeliveryDetails, setSelectedDeliveryDetails] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-2xl max-w-6xl w-full mx-4">
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

      // Updated API endpoint to match backend route
      const response = await axios.get(
        `http://localhost:5000/api/delivery/delivery-person/orders/${orderId}/details`,
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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold">Delivery Details</h2>
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
              <div className="flex items-center gap-3">
                <FiDollarSign className="text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">Delivery Cost</p>
                  <p className="font-medium">Rs. {selectedDeliveryDetails.deliveryCost}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FiTruck className="text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">Mileage</p>
                  <p className="font-medium">{selectedDeliveryDetails.mileage} km</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FiDroplet className="text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">Petrol Cost</p>
                  <p className="font-medium">Rs. {selectedDeliveryDetails.petrolCost}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FiClock className="text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">Time Spent</p>
                  <p className="font-medium">{selectedDeliveryDetails.timeSpent} hours</p>
                </div>
              </div>
            </div>
            {selectedDeliveryDetails.additionalNotes && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">Additional Notes</p>
                <p className="mt-1 text-gray-700">{selectedDeliveryDetails.additionalNotes}</p>
              </div>
            )}
            {selectedDeliveryDetails.submittedAt && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">Submitted At</p>
                <p className="mt-1 text-gray-700">
                  {new Date(selectedDeliveryDetails.submittedAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500">No delivery details available</p>
          </div>
        )}
      </div>
    </div>
  );

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

      {/* Delivery Persons Modal */}
      {showDeliveryPersonsModal && <DeliveryPersonsModal />}

      {/* Add the delivery details modal */}
      {showDeliveryDetails && <DeliveryDetailsModal />}
    </div>
  );
};

export default DeliveryManagerDashboard; 