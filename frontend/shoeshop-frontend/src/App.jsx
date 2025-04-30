import {BrowserRouter, Routes, Route} from "react-router-dom";
import { Link } from 'react-router-dom';
import './App.css';
import './index.css'
import  { Toaster} from 'react-hot-toast';
import CustomerDashboard from "./pages/customerDashboard";
import { FloatingShape } from "./components/FloatingShape";
import CustomerSignup from "./pages/CustomerSignup";
import CustomerLoginPage from "./pages/CustomerLoginPage";
import EmailVerificationPage from "./pages/EmailVerificationPage";
import { useAuthStore } from "./store/authStore";
import { useEffect } from "react";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NavBar2 from "./components/NavBar2";
import Footer from "./components/Footer";
import Home from "../src/pages/Home";
import Collection from "./pages/Collection";
import Product from "../src/pages/Product";
import Cart from "../src/pages/Cart";
import PlaceOrder from "../src/pages/PlaceOrder";
import { Navigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import { useLocation } from "react-router-dom";
import Payment_success from "./pages/Payment_success";
import Payment_cancel from "./pages/Payment_cancel";
import Notify from "./pages/Notify";
import EmployeeRoutes from "./pages/EmployeeRoutes";
import EmployeeLogin from "./pages/EmployeeLogin";
import Orders from "./pages/Orders";
import AllOrders from "./pages/AllOrders"
import ReviewSection from "./pages/Reviews";
import DeliveryManagerLogin from "./pages/delivary/DeliveryManagerLogin";
import DeliveryManagerDashboard from "./pages/delivary/DeliveryManagerDashboard";
import DeliveryLogin from "./pages/delivary/DeliveryLogin";
import DeliverySignup from "./pages/delivary/DeliverySignup";
import DeliveryPersonDashboard from "./pages/delivary/DeliveryPersonDashboard";

const RedirectAuthenticatedUser = ({children})=>{
  const {isAuthenticated, user} = useAuthStore();

  if(isAuthenticated && user.isVerified){
    return <Navigate to="/" replace />
  }
  return children
}

const ProtectedDeliveryRoute = ({ children }) => {
  const token = localStorage.getItem('deliveryManagerToken');
  if (!token) {
    return <Navigate to="/delivery-login" replace />;
  }
  return children;
};

const ProtectedDeliveryPersonRoute = ({ children }) => {
  const token = localStorage.getItem('deliveryPersonToken');
  console.log('Checking delivery person token:', token); // For debugging
  if (!token) {
    return <Navigate to="/delivery-person-login" replace />;
  }
  return children;
};

function App() {
  const { isAuthenticated, checkAuth, user } = useAuthStore();

	useEffect(() => {
		checkAuth();
	}, [checkAuth])

  console.log("isAuthen", isAuthenticated)
  console.log("user", user)

  const location = useLocation();
  const noFooterRoutes = ['/customerlogin', '/login', '/customerregister', '/customerdashboard', '/employeelogin', '/admindashboard', '/delivery-login', '/delivery-dashboard'];
  const noHeaderRoutes = ['/employeelogin', '/admindashboard', '/delivery-login', '/delivery-dashboard'];

  return (
    <>
      <Toaster position="top-right"/>
      <ToastContainer />
      {!noHeaderRoutes.includes(location.pathname) && <NavBar2 />}
      <Routes>
        <Route path="/" element={<Home />}/>
        <Route path="/customerlogin" element={<CustomerLoginPage />}/>
        <Route path="/customerdashboard" element={<CustomerDashboard />}/>
        
        {/* Delivery Manager Routes */}
        <Route path="/delivery-login" element={<DeliveryManagerLogin />}/>
        <Route path="/delivery-dashboard" element={
          <ProtectedDeliveryRoute>
            <DeliveryManagerDashboard />
          </ProtectedDeliveryRoute>
        }/>

        {/* Delivery Person Routes */}
        <Route path="/delivery-person-login" element={<DeliveryLogin />}/>
        <Route path="/delivery-signup" element={<DeliverySignup />}/>
        <Route path="/delivery-person-dashboard" element={
          <ProtectedDeliveryPersonRoute>
            <DeliveryPersonDashboard />
          </ProtectedDeliveryPersonRoute>
        }/>

        <Route path="/customerregister" element={
          <RedirectAuthenticatedUser>
            <CustomerSignup />
          </RedirectAuthenticatedUser>
        }/>

        <Route path="/floating" element={<FloatingShape />}/>
        <Route path="/verify-email" element={<EmailVerificationPage />}/>
        <Route path="/forgot-password" element={<ForgotPasswordPage />}/>
        <Route path="/reset-password/:token" element={<ResetPasswordPage />}/>

        <Route path="/collection" element={<Collection/>}/>
        <Route path="/product/:productId" element={<Product/>}/>
        <Route path="/cart" element={<Cart/>}/>
        <Route path="/placeOrder" element={<PlaceOrder/>} />
        <Route path="/Payment_success" element={<Payment_success/>} />
        <Route path="/Payment_cancel" element={<Payment_cancel/>} />
        <Route path="/Notify" element={<Notify/>} />
        <Route path="/orders" element={<Orders/>}/>
        <Route path="/allorders" element={<AllOrders />}/>
        <Route path="/reviews" element={<ReviewSection/>}/>

      </Routes>
      <EmployeeRoutes />
      {!noFooterRoutes.includes(location.pathname) && <Footer />}
    </>
  )
}

export default App
