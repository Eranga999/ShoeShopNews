import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CryptoJS from "crypto-js"; // Import CryptoJS
import axios from 'axios';
const PlaceOrder = () => {
  const [message, setMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cartData,setCartData] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    address: "",
    phone: "",
    email: "",
    city: "",
    country: "Sri Lanka",
  });

  const userId = "user236"
  const DELIVERY_FEE = 200;
  const navigate = useNavigate();

  // Merchant credentials (replace with your actual credentials)
  const merchant_id = "1230105"; // Replace with your Merchant ID
  const merchant_secret = "MjE3OTQ4OTkxNjM0ODU3OTQ2NDU0MTAyMDU4NjEzMjM1NDU4MjQ2MA=="; // Replace with your Merchant Secret

  // Load PayHere script when component mounts
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://www.payhere.lk/lib/payhere.js";
    script.async = true;

    script.onload = () => {
      if (window.payhere) {
        window.payhere.onCompleted = function onCompleted(orderId) {
          console.log("Payment completed. OrderID:", orderId);
          setMessage("Payment Successful!");
          setIsModalOpen(true);
        };

        window.payhere.onDismissed = function onDismissed() {
          console.log("Payment dismissed");
        };

        window.payhere.onError = function onError(error) {
          console.error("PayHere Error:", error);
          setMessage("Payment Error: " + error);
          setIsModalOpen(true);
        };
      }
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    // const userId = "user122"
    axios.get(`http://localhost:5000/api/cart/${userId}`)
    .then((res) => {
        console.log('Cart data:', res.data); // Debugging console log
        setCartData(res.data);
        // setCartData(res.data.items || []); // Assuming `items` contains cart products
    })
    .catch((err) => {
        console.error("Error fetching cart:", err);
    });
    
}, []);

  // Function to generate the secure hash using CryptoJS
  const generateHash = (merchant_id, order_id, amount, currency, merchant_secret) => {
    // Step 1: Generate MD5 hash of the merchant secret
    const secretHash = CryptoJS.MD5(merchant_secret).toString().toUpperCase();

    // Step 2: Concatenate all required fields
    const fullString = `${merchant_id}${order_id}${amount}${currency}${secretHash}`;

    // Step 3: Generate MD5 hash of the concatenated string and convert to uppercase
    const hash = CryptoJS.MD5(fullString).toString().toUpperCase();

    return hash;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleClick = (type) => {
    if (type === "green") {
      payWithCash(); 
    } else if (type === "yellow") {
      payWithPayHere();
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    if(message == "Order placed successfully!"){
      // navigate("/");
    }
    if(message == "Payment Successful!"){
      navigate("/");
    }
    setMessage("");
  };

  const payWithCash = async () => {
    if (!formData.firstName || !formData.lastName || !formData.address || !formData.phone) {
      setMessage("Please fill all required fields");
      setIsModalOpen(true);
      return;
    }
  
    await saveOrderToDatabase("Unpaid"); // Save with status "Unpaid"
    setMessage("Order placed successfully!");
    setIsModalOpen(true);
  };
  

  const totalPrice = () => {
    let total = 0;
  
    if (cartData && Array.isArray(cartData.items)) {
      for (let i = 0; i < cartData.items.length; i++) {
        const item = cartData.items[i];
        total += item.price * item.quantity;
      }
      total+= DELIVERY_FEE;
    }
  
    return total;
  };
  
  const tot = totalPrice().toFixed(2);
  
  const saveOrderToDatabase = async (paymentStatus) => {
    if (!cartData || !Array.isArray(cartData.items)) {
      setMessage("Cart is empty or invalid.");
      setIsModalOpen(true);
      return;
    }
  
    const orderPayload = {
      userId: userId,
      firstName: formData.firstName,
      lastName: formData.lastName,
      totalAmount: totalPrice(),
      orderDate: new Date(),
      paymentMethod: paymentStatus === "Paid" ? "PayHere" : "Cash on Delivery",
      paymentStatus: paymentStatus,
      shippingAddress: formData.address,
      phonenumber: formData.phone,
      email: formData.email,
      city: formData.city,
      items: cartData.items.map(item => ({
        shoeId: item.brand.brandId,
        BrandName:item.brand.brandName,
        ModelName:item.brand.modelName,
        color: item.color.colorName,
        size: item.size.size,
        quantity: item.quantity,
        imageUrl: item.imageUrl,
      }))
    };
  
    try {
      const res = await axios.post("http://localhost:5000/api/order", orderPayload);
      console.log("Order saved:", res.data);
    } catch (error) {
      console.error("Error saving order:", error);
      setMessage("Error saving order. Please try again.");
      setIsModalOpen(true);
    }
  };
  

  const payWithPayHere = () => {
    // Validate form inputs first
    if (!formData.firstName || !formData.lastName || !formData.address || !formData.phone) {
      setMessage("Please fill all required fields");
      setIsModalOpen(true);
      return;
    }

    // Check if PayHere script is loaded
    window.payhere.onCompleted = async function onCompleted(orderId) {
      console.log("Payment completed. OrderID:", orderId);
      await saveOrderToDatabase("Paid"); // Save with status "Paid"
      setMessage("Payment Successful!");
      setIsModalOpen(true);
    };
    

    
    

    // Create a unique order ID
    const order_id = "Order" + new Date().getTime();
    const amount = tot; // Fixed amount for testing
    const currency = "LKR";

    // Generate the secure hash
    const hash = generateHash(merchant_id, order_id, amount, currency, merchant_secret);

    // Configure the PayHere payment object
    const payment = {
      sandbox: true, // Set to false when going live
      merchant_id: merchant_id, // Merchant ID
      return_url: window.location.origin + "/payment-success", // Redirect after success
      cancel_url: window.location.origin + "/payment-cancel", // Redirect if cancelled
      notify_url: window.location.origin + "/notify",

      order_id: order_id,
      items: "Test Product",
      amount: amount,
      currency: currency,
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email || "customer@example.com",
      phone: formData.phone,
      address: formData.address,
      city: formData.city || "Colombo",
      country: formData.country || "Sri Lanka",
      hash: hash, // Include the generated hash
    };

    // Start the PayHere payment
    window.payhere.startPayment(payment);
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Complete Your Order</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Billing Details Form */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Billing Details</h3>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full h-10 px-3 border-2 border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full h-10 px-3 border-2 border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full h-10 px-3 border-2 border-gray-300 rounded focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full h-10 px-3 border-2 border-gray-300 rounded focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full h-10 px-3 border-2 border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full h-10 px-3 border-2 border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full h-10 px-3 border-2 border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Payment Options */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Payment Options</h3>
          <div className="flex flex-col space-y-4">
            <button
              onClick={() => handleClick("green")}
              className="bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded transition"
            >
              Place Order (Direct)
            </button>
            <button
              onClick={() => handleClick("yellow")}
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-800 py-3 px-4 rounded transition"
            >
              Pay with PayHere
            </button>
          </div>
          <div className="mt-6 p-4 bg-gray-100 rounded">
            <h4 className="font-medium mb-2">Order Summary</h4>
            <div className="flex justify-between mb-2">
              <span>Product:</span>
              <span>Test Product</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span>LKR {tot}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md text-center">
            <p className="text-lg font-medium mb-4">{message}</p>
            <button
              onClick={closeModal}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaceOrder;