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
    FiCreditCard
} from "react-icons/fi";
import axios from "axios";
import { toast } from "react-toastify";

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
                    price: item.price
                }))
            }));

            console.log('Fetched orders:', transformedOrders); // Debug log
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
                toast.error('Failed to fetch orders');
            }
            setLoading(false);
        }
    };

    // Add auto-refresh functionality
    useEffect(() => {
        if (profile) {
            fetchAssignedOrders();
            // Refresh orders every 30 seconds
            const interval = setInterval(fetchAssignedOrders, 30000);
            return () => clearInterval(interval);
        }
    }, [profile]);

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            const token = localStorage.getItem('deliveryPersonToken');
            await axios.put(
                `http://localhost:5000/api/delivery/delivery-person/orders/${orderId}/status`,
                { deliveryStatus: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );

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
        } catch (error) {
            console.error('Error updating order status:', error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                toast.error('Session expired. Please login again.');
                localStorage.removeItem('deliveryPersonToken');
                navigate('/delivery-person-login');
            } else {
                toast.error('Failed to update order status');
            }
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('deliveryPersonToken');
        navigate('/delivery-person-login');
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
                                                <select
                                                    value={order.deliveryStatus}
                                                    onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                                    className="block w-full p-2 rounded-md border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                >
                                                    <option value="processing">Processing</option>
                                                    <option value="pickedup">Picked Up</option>
                                                    <option value="delivered">Delivered</option>
                                                </select>
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
    );
};

export default DeliveryPersonDashboard; 