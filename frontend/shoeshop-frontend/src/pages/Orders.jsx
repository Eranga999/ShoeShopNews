import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-hot-toast';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/customerlogin');
      return;
    }

    axios
      .get(`http://localhost:5000/api/order/${user._id}`, {
        withCredentials: true
      })
      .then((res) => {
        console.log('Order data:', res.data);
        setOrders(res.data);
      })
      .catch((err) => {
        console.error("Error fetching orders:", err);
        if (err.response?.status === 401) {
          toast.error('Please login to view your orders');
          navigate('/customerlogin');
        } else {
          toast.error('Failed to fetch orders');
        }
      });
  }, [user?._id, isAuthenticated, navigate]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">My Orders</h1>

      <div className="space-y-6">
        {orders.length === 0 ? (
          <p className="text-gray-500">No orders found.</p>
        ) : (
          orders.map((order, index) => (
            <div key={order._id} className="bg-white shadow-lg rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Order #{index + 1} — {order.paymentMethod}
                </h2>
                <span
                  className={`text-sm px-3 py-1 rounded-full font-medium ${
                    order.paymentStatus === 'Paid'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {order.paymentStatus}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
                <div>
                  <p><strong>Customer:</strong> {order.firstName} {order.lastName}</p>
                  <p><strong>Email:</strong> {order.email}</p>
                  <p><strong>Phone:</strong> {order.phonenumber}</p>
                </div>
                <div>
                  <p><strong>City:</strong> {order.city}</p>
                  <p><strong>Shipping:</strong> {order.shippingAddress}</p>
                  <p><strong>Date:</strong> {new Date(order.orderDate).toLocaleString()}</p>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold text-gray-700 mb-2">Items:</h3>
                <div className="grid gap-4">
                  {order.items.map((item) => (
                    <div
                      key={item._id}
                      className="flex items-center space-x-4 bg-gray-50 p-3 rounded-lg"
                    >
                      <img
                        src={item.imageUrl}
                        alt="shoe"
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div>
                        <p className="font-medium text-gray-800">Shoe Brand: {item.BrandName}</p>
                        <p className="font-medium text-gray-800">Model: {item.ModelName}</p>
                        <p className="text-sm text-gray-600">
                          Color: {item.color} | Size: {item.size} | Quantity: {item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-right">
                <p className="text-lg font-bold text-gray-800">
                  Total: Rs. {order.totalAmount.toFixed(2)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Orders;
