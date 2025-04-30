import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FiPackage, 
    FiTruck, 
    FiMap, 
    FiCalendar, 
    FiCheck, 
    FiX, 
    FiRefreshCw,
    FiLogOut,
    FiUser,
    FiPhone,
    FiMail,
    FiTrello,
    FiCreditCard,
    FiAlertCircle
} from "react-icons/fi";
import axios from "axios";
import { toast } from "react-toastify";
import DeliveryDetailsForm from './DeliveryDetailsForm';

const DeliveryPersonDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [profile, setProfile] = useState(null);
    const [showProfile, setShowProfile] = useState(false);
    const [deliveryStats, setDeliveryStats] = useState({
        pendingDeliveries: 0,
        inTransit: 0,
        completed: 0,
        totalDeliveries: 0
    });
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderDetails, setShowOrderDetails] = useState(false);
    const [showDeliveryForm, setShowDeliveryForm] = useState(false);
    const [selectedOrderForDetails, setSelectedOrderForDetails] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('deliveryPersonToken');
        if (!token) {
            navigate('/delivery-person-login');
            return;
        }

        fetchProfile();
    }, [navigate]);

    useEffect(() => {
        if (profile) {
            fetchAssignedOrders();
            // Refresh orders every 30 seconds
            const interval = setInterval(fetchAssignedOrders, 30000);
            return () => clearInterval(interval);
        }
    }, [profile]);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('deliveryPersonToken');
            const response = await axios.get('http://localhost:5000/api/delivery/delivery-person/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfile(response.data.deliveryPerson);
        } catch (error) {
            console.error('Error fetching profile:', error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                toast.error('Session expired. Please login again.');
                localStorage.removeItem('deliveryPersonToken');
                navigate('/delivery-person-login');
            } else {
                toast.error('Failed to fetch profile');
            }
        }
    };

    const fetchAssignedOrders = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('deliveryPersonToken');
            const response = await axios.get(
                'http://localhost:5000/api/delivery/delivery-person/orders',
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const ordersData = Array.isArray(response.data) ? response.data : [];
            
            // Transform the orders data to match the frontend structure
            const transformedOrders = ordersData.map(order => ({
                _id: order._id,
                customerName: `${order.firstName} ${order.lastName}`,
                customerEmail: order.email,
                shippingAddress: order.shippingAddress,
                deliveryStatus: order.deliveryStatus || 'processing',
                totalPrice: order.totalAmount,
                paymentMethod: order.paymentMethod,
                paymentStatus: order.paymentStatus,
                items: order.items.map(item => ({
                    product: {
                        name: `${item.BrandName} ${item.ModelName}`,
                    },
                    quantity: item.quantity,
                    imageUrl: item.imageUrl || null,
                    price: item.price || (order.totalAmount / order.items.reduce((sum, i) => sum + i.quantity, 0))
                }))
            }));

            console.log('Transformed orders:', transformedOrders);
            setOrders(transformedOrders);
            
            // Calculate stats
            const stats = {
                pendingDeliveries: transformedOrders.filter(order => order.deliveryStatus === 'processing').length,
                inTransit: transformedOrders.filter(order => order.deliveryStatus === 'pickedup').length,
                completed: transformedOrders.filter(order => order.deliveryStatus === 'delivered').length,
                totalDeliveries: transformedOrders.length
            };
            
            setDeliveryStats(stats);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching orders:', error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                toast.error('Session expired. Please login again.');
                localStorage.removeItem('deliveryPersonToken');
                navigate('/delivery-person-login');
            } else {
                toast.error(error.response?.data?.message || 'Failed to fetch orders');
            }
            setLoading(false);
        }
    };

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            const token = localStorage.getItem('deliveryPersonToken');
            const response = await axios.put(
                `http://localhost:5000/api/delivery/delivery-person/orders/${orderId}/status`,
                { deliveryStatus: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                // Update orders state
                setOrders(prevOrders => prevOrders.map(order => {
                    if (order._id === orderId) {
                        return { ...order, deliveryStatus: newStatus };
                    }
                    return order;
                }));

                // Update stats
                fetchAssignedOrders();
                toast.success('Order status updated successfully');
            } else {
                throw new Error(response.data.message || 'Failed to update status');
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                toast.error('Session expired. Please login again.');
                localStorage.removeItem('deliveryPersonToken');
                navigate('/delivery-person-login');
            } else {
                toast.error(error.response?.data?.message || 'Failed to update order status');
            }
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('deliveryPersonToken');
        navigate('/delivery-person-login');
    };

    const handleDeliveryDetailsSubmit = async (details) => {
        try {
            await fetchAssignedOrders(); // Refresh orders after submission
            toast.success('Delivery details submitted successfully');
        } catch (error) {
            console.error('Error refreshing orders:', error);
            toast.error('Failed to refresh orders list');
        }
    };

    const OrderDetailsModal = () => (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full">
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-bold">Order Details</h2>
                    <button
                        onClick={() => setShowOrderDetails(false)}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <FiX className="w-6 h-6" />
                    </button>
                </div>
                {selectedOrder && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="font-semibold">Order Information</p>
                                <p>Order ID: {selectedOrder._id}</p>
                                <p>Status: <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    selectedOrder.deliveryStatus === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                                    selectedOrder.deliveryStatus === 'pickedup' ? 'bg-blue-100 text-blue-800' :
                                    selectedOrder.deliveryStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                    {selectedOrder.deliveryStatus.charAt(0).toUpperCase() + selectedOrder.deliveryStatus.slice(1)}
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
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex justify-between font-semibold">
                                <span>Total Amount:</span>
                                <span>Rs.{selectedOrder.totalPrice.toFixed(2)}</span>
                            </div>
                        </div>
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
                {/* Header with Profile Toggle */}
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My Deliveries</h1>
                        <p className="mt-2 text-gray-600">Welcome back, {profile?.name}</p>
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
                            onClick={fetchAssignedOrders}
                            className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                        >
                            <FiRefreshCw className="text-lg" />
                            Refresh
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            <FiLogOut className="text-lg" />
                            Logout
                        </button>
                    </div>
                </div>

                {/* Profile Section */}
                {showProfile && profile && (
                    <div className="mb-8 bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-2xl font-bold mb-4">Profile Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-center gap-3">
                                <FiUser className="text-blue-500" />
                                <div>
                                    <p className="text-sm text-gray-500">Full Name</p>
                                    <p className="font-medium">{profile.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <FiMail className="text-blue-500" />
                                <div>
                                    <p className="text-sm text-gray-500">Email</p>
                                    <p className="font-medium">{profile.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <FiPhone className="text-blue-500" />
                                <div>
                                    <p className="text-sm text-gray-500">Phone</p>
                                    <p className="font-medium">{profile.phone}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <FiTrello className="text-blue-500" />
                                <div>
                                    <p className="text-sm text-gray-500">Vehicle Number</p>
                                    <p className="font-medium">{profile.vehicleNumber}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <FiCreditCard className="text-blue-500" />
                                <div>
                                    <p className="text-sm text-gray-500">License Number</p>
                                    <p className="font-medium">{profile.licenseNumber}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <FiCheck className="text-blue-500" />
                                <div>
                                    <p className="text-sm text-gray-500">Status</p>
                                    <p className="font-medium capitalize">{profile.status}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                                <FiCalendar size={24} />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm text-gray-500">Total</p>
                                <p className="text-2xl font-semibold text-gray-900">{deliveryStats.totalDeliveries}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Orders Table */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold mb-4">Assigned Orders</h2>
                    {orders.length === 0 ? (
                        <div className="text-center py-8">
                            <FiPackage className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No Orders</h3>
                            <p className="mt-1 text-sm text-gray-500">You don't have any orders assigned yet.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {orders.map((order) => (
                                        <tr key={order._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {order._id.substring(0, 8)}...
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                                                <div className="text-sm text-gray-500">{order.customerEmail}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {order.shippingAddress}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {order.items?.map((item, index) => (
                                                    <div key={index} className="mb-1">
                                                        {item.quantity}x {item.product?.name || 'Product'}
                                                    </div>
                                                ))}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    order.deliveryStatus === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                                                    order.deliveryStatus === 'pickedup' ? 'bg-blue-100 text-blue-800' :
                                                    order.deliveryStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {order.deliveryStatus.charAt(0).toUpperCase() + order.deliveryStatus.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    <select
                                                        value={order.deliveryStatus}
                                                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                                        className="block p-2 rounded-md border border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                    >
                                                        <option value="processing">Processing</option>
                                                        <option value="pickedup">Picked Up</option>
                                                        <option value="delivered">Delivered</option>
                                                    </select>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedOrder(order);
                                                            setShowOrderDetails(true);
                                                        }}
                                                        className="text-blue-600 hover:text-blue-900"
                                                        title="View Order Details"
                                                    >
                                                        <FiAlertCircle className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedOrderForDetails(order);
                                                            setShowDeliveryForm(true);
                                                        }}
                                                        className="text-green-600 hover:text-green-900"
                                                        title="Submit Delivery Details"
                                                    >
                                                        <FiTruck className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Order Details Modal */}
            {showOrderDetails && <OrderDetailsModal />}

            {/* Delivery Details Form Modal */}
            {showDeliveryForm && selectedOrderForDetails && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
                    <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full m-4">
                        <DeliveryDetailsForm
                            orderId={selectedOrderForDetails._id}
                            onSubmit={handleDeliveryDetailsSubmit}
                            onClose={() => {
                                setShowDeliveryForm(false);
                                setSelectedOrderForDetails(null);
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeliveryPersonDashboard; 