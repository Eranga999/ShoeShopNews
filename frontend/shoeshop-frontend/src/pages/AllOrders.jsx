import React, { useEffect, useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');

  useEffect(() => {
    axios.get('http://localhost:5000/api/order/all')
      .then(res => {
        setOrders(res.data);
      })
      .catch(err => {
        console.error("Error fetching orders:", err);
      });
  }, []);

  // Filter orders by selected month
  const filteredOrders = selectedMonth
    ? orders.filter(order => {
        const date = new Date(order.orderDate);
        const month = date.getMonth() + 1; // 0-indexed
        const year = date.getFullYear();
        const [selectedYear, selectedMonthNumber] = selectedMonth.split('-').map(Number);
        return month === selectedMonthNumber && year === selectedYear;
      })
    : orders;

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Orders Report - ${selectedMonth || 'All'}`, 14, 20);

    let y = 30;
    filteredOrders.forEach((order, index) => {
      doc.setFontSize(12);
      doc.text(`Order ID: ${order._id}`, 14, y);
      doc.text(`User: ${order.firstName || ''} ${order.lastName || ''}`, 14, y + 6);
      doc.text(`Total: Rs. ${order.totalAmount}`, 14, y + 12);
      doc.text(`Status: ${order.paymentStatus}`, 14, y + 18);
      doc.text(`Method: ${order.paymentMethod}`, 14, y + 24);
      doc.text(`Date: ${new Date(order.orderDate).toLocaleDateString()}`, 14, y + 30);
      doc.text(`Address: ${order.shippingAddress}, ${order.city || ''}`, 14, y + 36);
      doc.text(`Phone: ${order.phonenumber || ''}`, 14, y + 42);
      doc.text(`Email: ${order.email || ''}`, 14, y + 48);

      const itemData = order.items.map(item => ([
        item.ModelName || item.BrandName || 'N/A',
        item.color,
        item.size,
        item.quantity
      ]));

      autoTable(doc, {
        head: [["Model", "Color", "Size", "Qty"]],
        body: itemData,
        startY: y + 54,
        styles: { fontSize: 10 }
      });

      y = doc.lastAutoTable.finalY + 10;
      if (y > 260 && index !== filteredOrders.length - 1) {
        doc.addPage();
        y = 20;
      }
    });

    const fileName = selectedMonth ? `orders-${selectedMonth}.pdf` : "orders-report.pdf";
    doc.save(fileName);
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen font-display">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-center md:text-left">All Orders Dashboard</h1>

        <div className="flex gap-4">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border rounded px-3 py-2"
          />

          <button
            onClick={generatePDF}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg shadow-md"
          >
            Download PDF
          </button>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <p className="text-center text-gray-500 mt-8">No orders found for this month.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map(order => (
            <div key={order._id} className="bg-white shadow-lg rounded-2xl p-4">
              <div className="mb-4">
                <h2 className="text-xl font-semibold">Order ID: {order._id}</h2>
                <p><span className="font-medium">User ID:</span> {order.userId}</p>
                {order.firstName && <p><span className="font-medium">Customer:</span> {order.firstName} {order.lastName}</p>}
                <p><span className="font-medium">Amount:</span> Rs. {order.totalAmount.toFixed(2)}</p>
                <p><span className="font-medium">Status:</span> {order.paymentStatus}</p>
                <p><span className="font-medium">Method:</span> {order.paymentMethod}</p>
                <p><span className="font-medium">Date:</span> {new Date(order.orderDate).toLocaleDateString()}</p>
                <p><span className="font-medium">Address:</span> {order.shippingAddress}</p>
                {order.city && <p><span className="font-medium">City:</span> {order.city}</p>}
                {order.email && <p><span className="font-medium">Email:</span> {order.email}</p>}
                {order.phonenumber && <p><span className="font-medium">Phone:</span> {order.phonenumber}</p>}
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-2">Items:</h3>
                {order.items.map(item => (
                  <div key={item._id} className="flex items-center mb-2">
                    <img src={item.imageUrl} alt="Shoe" className="w-16 h-16 object-cover rounded-md mr-4 border" />
                    <div>
                      {item.BrandName && <p className="font-medium">Brand: {item.BrandName}</p>}
                      {item.ModelName && <p className="font-medium">Model: {item.ModelName}</p>}
                      <p>Color: {item.color}</p>
                      <p>Size: {item.size}</p>
                      <p>Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
