import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CryptoJS from "crypto-js"; // Import CryptoJS
import axios from 'axios';
import { useAuthStore } from "../store/authStore";

const PlaceOrder = () => {
  const [message, setMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cartData, setCartData] = useState("");
  const [total, setTotal] = useState(0);
  const { user, isAuthenticated } = useAuthStore();
  
  // PayHere merchant credentials
  const merchant_id = "1230105";
  const merchant_secret = "MjE3OTQ4OTkxNjM0ODU3OTQ2NDU0MTAyMDU4NjEzMjM1NDU4MjQ2MA==";
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    address: "",
    phone: "",
    email: "",
    city: "",
    country: "Sri Lanka",
  });

  const DELIVERY_FEE = 200;
  const navigate = useNavigate();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/customerlogin');
      return;
    }
  }, [isAuthenticated, user, navigate]);

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

  // Fetch cart data
  useEffect(() => {
    if (!user?._id) {
      console.log('No user ID available');
      return;
    }
    
    console.log('Fetching cart for user:', user._id);
    
    axios.get(`http://localhost:5000/api/cart/${user._id}`, {
      withCredentials: true
    })
    .then((res) => {
        console.log('Raw cart response:', res);
        console.log('Cart data structure:', {
          hasItems: !!res.data.items,
          itemsIsArray: Array.isArray(res.data.items),
          itemCount: res.data.items ? res.data.items.length : 0,
          firstItem: res.data.items?.[0]
        });
        setCartData(res.data);
    })
    .catch((err) => {
        console.error("Error fetching cart:", err);
        if (err.response?.status === 401) {
          navigate('/customerlogin');
        }
    });
    
  }, [user?._id, navigate]);

  // Add useEffect to calculate total whenever cartData changes
  useEffect(() => {
    calculateTotal();
  }, [cartData]);

  const calculateTotal = () => {
    let calculatedTotal = 0;
    
    if (cartData && cartData.items && Array.isArray(cartData.items)) {
      calculatedTotal = cartData.items.reduce((sum, item) => {
        const itemPrice = item.price || 0;
        const quantity = item.quantity || 0;
        return sum + (itemPrice * quantity);
      }, 0);
      
      // Add delivery fee
      calculatedTotal += DELIVERY_FEE;
    }
    
    setTotal(calculatedTotal);
    return calculatedTotal;
  };

  // Replace the old totalPrice function
  const totalPrice = () => {
    return total;
  };

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
  

  const saveOrderToDatabase = async (paymentStatus) => {
    if (!cartData || !Array.isArray(cartData.items)) {
      setMessage("Cart is empty or invalid.");
      setIsModalOpen(true);
      return;
    }
  
    const orderPayload = {
      userId: user._id,
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
        BrandName: item.brand.brandName,
        ModelName: item.brand.modelName,
        color: item.color.colorName,
        size: item.size.size,
        quantity: item.quantity,
        imageUrl: item.imageUrl,
      }))
    };
  
    try {
      const response = await axios.post("http://localhost:5000/api/order", orderPayload, {
        withCredentials: true
      });
      console.log("Order saved:", response.data);
    } catch (error) {
      console.error("Error saving order:", error);
      setMessage("Error saving order. Please try again.");
      setIsModalOpen(true);
      if (error.response?.status === 401) {
        navigate('/customerlogin');
      }
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
    if (!window.payhere) {
      setMessage("Payment gateway is not loaded. Please try again.");
      setIsModalOpen(true);
      return;
    }

    // Create a unique order ID
    const order_id = "Order" + new Date().getTime();
    const amount = total.toFixed(2); // Ensure two decimals
    const currency = "LKR";

    // Generate the secure hash (amount as string with two decimals)
    const secretHash = CryptoJS.MD5(merchant_secret).toString().toUpperCase();
    const fullString = `${merchant_id}${order_id}${amount}${currency}${secretHash}`;
    const hash = CryptoJS.MD5(fullString).toString().toUpperCase();

    // Configure the PayHere payment object
    const payment = {
      sandbox: true, // Set to false when going live
      merchant_id: merchant_id,
      return_url: window.location.origin + "/payment-success",
      cancel_url: window.location.origin + "/payment-cancel",
      notify_url: "http://localhost:5000/api/payment/notify",

      order_id: order_id,
      items: cartData.items.map(item => `${item.brand.brandName} ${item.brand.modelName}`).join(", "),
      amount: amount, // Use the string with two decimals
      currency: currency,
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email || "customer@example.com",
      phone: formData.phone,
      address: formData.address,
      city: formData.city || "Colombo",
      country: formData.country || "Sri Lanka",
      hash: hash
    };

    console.log('PayHere payment config:', payment); // Debug log

    // Set up the completion callback
    window.payhere.onCompleted = async function onCompleted(orderId) {
      console.log("Payment completed. OrderID:", orderId);
      try {
        await saveOrderToDatabase("Paid");
        setMessage("Payment Successful!");
        setIsModalOpen(true);
      } catch (error) {
        console.error("Error saving order:", error);
        setMessage("Payment successful but error saving order. Please contact support.");
        setIsModalOpen(true);
      }
    };

    window.payhere.onDismissed = function onDismissed() {
      console.log("Payment dismissed");
      setMessage("Payment cancelled by user");
      setIsModalOpen(true);
    };

    window.payhere.onError = function onError(error) {
      console.error("PayHere Error:", error);
      setMessage("Payment Error: " + error);
      setIsModalOpen(true);
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
              <span>Subtotal:</span>
              <span>LKR {cartData && cartData.items ? (total - DELIVERY_FEE).toFixed(2) : '0.00'}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Delivery Fee:</span>
              <span>LKR {DELIVERY_FEE.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold border-t pt-2 mt-2">
              <span>Total:</span>
              <span>LKR {total.toFixed(2)}</span>
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