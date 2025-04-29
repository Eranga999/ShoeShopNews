import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const OrderStatus = () => {
  const statusOptions = ["Handed Over", "Recieved", "Order on the way"];
  const statusColors = {
    "Handed Over": "text-yellow-600",
    "Recieved": "text-blue-600",
    "Order on the way": "text-green-600"
  };

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/orders/all');
        setOrders(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch orders');
        setLoading(false);
        console.error('Error fetching orders:', err);
      }
    };

    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const response = await axios.put(`http://localhost:5000/api/orders/${orderId}`, {
        deliveryStatus: newStatus
      });

      setOrders(orders.map(order => 
        order._id === orderId 
          ? { ...order, deliveryStatus: response.data.deliveryStatus } 
          : order
      ));
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Failed to update order status');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading orders...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-600">{error}</div>;
  }

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen p-8">
      <div className="container mx-auto bg-white shadow-lg rounded-xl overflow-hidden">
        <div className="bg-indigo-600 text-white p-4">
          <h2 className="text-2xl font-bold">Order Management</h2>
        </div>
        
        {orders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No orders found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  {["Order ID", "Customer Name", "Contact", "Address", "Items", "Total Amount", "Payment Status", "Delivery Status", "Order Date"].map((header) => (
                    <th 
                      key={header} 
                      className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order._id.substring(0, 8)}...
                      </div>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.firstName} {order.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{order.email}</div>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.phonenumber}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-600 max-w-xs">
                        {order.shippingAddress}, {order.city}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-600">
                        {order.items.map((item, index) => (
                          <div key={index} className="mb-1">
                            • {item.quantity}x Size {item.size} - {item.color}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${order.totalAmount}
                      </div>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        order.paymentStatus === 'Paid' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <select 
                        value={order.deliveryStatus}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        className={`w-full p-2 rounded-md border ${statusColors[order.deliveryStatus] || 'text-gray-800'} focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
                      >
                        {statusOptions.map((status) => (
                          <option 
                            key={status} 
                            value={status}
                            className="bg-white text-gray-900"
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(order.orderDate).toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className='flex justify-end p-8'>
        <Link to="/delivery">
          <button className='p-4 bg-blue-800 hover:bg-blue-700 rounded-lg text-white'>Delivery Details</button>
        </Link>
      </div>
    </div>
  );
};

export default OrderStatus;