import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';

const AssignDeliveryPerson = () => {
  const [deliveryPersons] = useState([
    { id: '1', name: 'Mike Johnson' },
    { id: '2', name: 'Sarah Thompson' },
    { id: '3', name: 'Alex Rodriguez' },
    { id: '4', name: 'Emily Chen' }
  ]);

  const [orders, setOrders] = useState([
    {
      _id: '1',
      customerName: 'John Doe',
      customerAddress: '123 Main St, Apt 4B, New York, NY 10001',
      products: [
        {
          product: { name: 'Laptop' },
          quantity: 2
        },
        {
          product: { name: 'Mouse' },
          quantity: 1
        }
      ],
      deliveryPerson: null,
      createdAt: new Date('2024-03-25T10:30:00')
    },
    {
      _id: '2',
      customerName: 'Jane Smith',
      customerAddress: '456 Elm Street, San Francisco, CA 94110',
      products: [
        {
          product: { name: 'Smartphone' },
          quantity: 1
        }
      ],
      deliveryPerson: null,
      createdAt: new Date('2024-03-24T15:45:00')
    }
  ]);

  // Handler to assign delivery person
  const handleDeliveryPersonAssign = (orderId, deliveryPersonId) => {
    setOrders(orders.map(order => 
      order._id === orderId 
        ? { 
            ...order, 
            deliveryPerson: deliveryPersons.find(person => person.id === deliveryPersonId) || null 
          } 
        : order
    ));
  };

  // Handler to delete an order
  const handleDeleteOrder = (orderId) => {
    setOrders(orders.filter(order => order._id !== orderId));
  };

  return (
    <div className="bg-gray-50 min-h-screen p-8">
      <div className="container mx-auto bg-white shadow-lg rounded-xl overflow-hidden">
        <div className="bg-teal-600 text-white p-4">
          <h2 className="text-2xl font-bold">Delivery Management</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                {["Customer", "Address", "Products", "Quantity", "Delivery Person", "Created", "Actions"].map((header) => (
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
                    <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm text-gray-600 max-w-xs truncate">{order.customerAddress}</div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {order.products.map((item) => item.product.name).join(', ')}
                    </div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {order.products.map((item) => item.quantity).join(', ')}
                    </div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <select 
                      value={order.deliveryPerson?.id || ''}
                      onChange={(e) => handleDeliveryPersonAssign(order._id, e.target.value)}
                      className="
                        w-full p-2 rounded-md border 
                        text-gray-900
                        focus:ring-2 focus:ring-teal-500 focus:outline-none
                      "
                    >
                      <option value="">Select Delivery Person</option>
                      {deliveryPersons.map((person) => (
                        <option 
                          key={person.id} 
                          value={person.id}
                          className="bg-white text-gray-900"
                        >
                          {person.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {order.createdAt.toLocaleString()}
                    </div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <button 
                      onClick={() => handleDeleteOrder(order._id)}
                      className="
                        text-red-500 hover:text-red-700 
                        bg-red-50 hover:bg-red-100 
                        p-2 rounded-full 
                        transition-colors 
                        focus:outline-none 
                        focus:ring-2 focus:ring-red-300
                        flex items-center justify-center
                      "
                      title="Delete Order"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {orders.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg">No orders available</p>
              <p className="text-sm">No active delivery orders</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignDeliveryPerson;
