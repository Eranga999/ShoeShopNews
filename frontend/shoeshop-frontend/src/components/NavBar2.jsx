import React, { useContext, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FiSearch, FiUser, FiShoppingCart, FiMenu, FiArrowLeft, FiTruck, FiX } from "react-icons/fi";
import { Link } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from "react-router-dom";

const NavBar2 = () => {
    const [visible, setVisible] = useState(false);
    const [showDeliveryDropdown, setShowDeliveryDropdown] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const {getCartCount} = useContext(ShopContext);

    const { isAuthenticated, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
      logout();
      setShowProfileMenu(false);
      navigate("/customerlogin");
    }

    const navigateorders = () => {
      setShowProfileMenu(false);
      navigate("/orders");
    }

    const toggleProfileMenu = () => {
      setShowProfileMenu(!showProfileMenu);
    }
    
    return (
      <div className='flex items-center justify-between py-5 font-medium ml-10 mr-10 text-lg font-display'>
        <Link to="/">
          <span className='text-xl w-36'>Shoe Paradise</span>
        </Link>

        <ul className='hidden sm:flex gap-5 text-sm text-gray-700'>
          <NavLink to= '/'className="flex flex-col items-center gap-1">
            <p>HOME</p>
            <hr className='w-2/4 border-none h-[1.5px] bg-gray-700 hidden' />
          </NavLink>

          <NavLink to= '/Collection'className="flex flex-col items-center gap-1 ">
            <p>COLLECTION</p>
            <hr className='w-2/4 border-none h-[1.5px] bg-gray-700 hidden ' />
          </NavLink>

          <NavLink to= '/About'className="flex flex-col items-center gap-1">
            <p>ABOUT</p>
            <hr className='w-2/4 border-none h-[1.5px] bg-gray-700 hidden ' />
          </NavLink>

          <NavLink to= '/Contact'className="flex flex-col items-center gap-1">
            <p>CONTACT</p>
            <hr className='w-2/4 border-none h-[1.5px] bg-gray-700 hidden ' />
          </NavLink>
        </ul>

        <div className='flex items-center gap-6'>
          <div className='flex items-center gap-4'>
            {!isAuthenticated ? (
              <>
                <Link 
                  to="/customerlogin" 
                  className="bg-black text-white px-4 py-2 rounded-full text-sm hover:bg-gray-800 transition-colors duration-300"
                >
                  Customer Login
                </Link>
                <div className="relative">
                  <button 
                    className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm hover:bg-blue-700 transition-colors duration-300 flex items-center"
                    onClick={() => setShowDeliveryDropdown(!showDeliveryDropdown)}
                  >
                    Delivery Login
                    <svg 
                      className="w-4 h-4 ml-2" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M19 9l-7 7-7-7" 
                      />
                    </svg>
                  </button>

                  {showDeliveryDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <Link 
                        to="/delivery-login"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowDeliveryDropdown(false)}
                      >
                        Delivery Manager Login
                      </Link>
                      <Link 
                        to="/delivery-person-login"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowDeliveryDropdown(false)}
                      >
                        Delivery Person Login
                      </Link>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className='relative'>
                <FiUser className="w-5 cursor-pointer" onClick={toggleProfileMenu}/>
                {showProfileMenu && (
                  <div className='absolute dropdown-menu right-0 pt-4'>
                    <div className='flex flex-col gap-2 w-48 py-3 px-5 bg-slate-100 text-gray-500 rounded shadow-lg'>
                      <div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-1">
                        <span className="font-medium text-gray-800">Menu</span>
                        <button 
                          onClick={() => setShowProfileMenu(false)}
                          className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                        >
                          <FiX className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                      <Link to="/customerdashboard" onClick={() => setShowProfileMenu(false)}>
                        <p className='cursor-pointer hover:text-black hover:bg-gray-200 px-2 py-1 rounded transition-colors'>My Profile</p>
                      </Link>
                      <p className='cursor-pointer hover:text-black hover:bg-gray-200 px-2 py-1 rounded transition-colors' onClick={navigateorders}>Orders</p>
                      <Link to="/delivery-service-review" onClick={() => setShowProfileMenu(false)}>
                        <p className='cursor-pointer hover:text-black hover:bg-gray-200 px-2 py-1 rounded transition-colors'>Rating</p>
                      </Link>
                      <Link to="/refund-orders" onClick={() => setShowProfileMenu(false)}>
                        <p className='cursor-pointer hover:text-black hover:bg-gray-200 px-2 py-1 rounded transition-colors'>Refund</p>
                      </Link>
                      <p className='cursor-pointer hover:text-black hover:bg-gray-200 px-2 py-1 rounded transition-colors'>WishList</p>
                      <p onClick={handleLogout} className='cursor-pointer hover:text-black hover:bg-gray-200 px-2 py-1 rounded transition-colors text-red-500 hover:text-red-600'>Logout</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <FiSearch className="w-5 cursor-pointer" />
          <Link to='/Cart' className='relative'>
            <FiShoppingCart className='w-5 min-w-5'/>
            <p className='absolute right-[-5px] bottom-[-5px] w-4 text-center leading-4 bg-black text-white aspect-square rounded-full text-[8px]'>{getCartCount()}</p>
          </Link>
          <FiMenu onClick={()=>setVisible(true)} className='w-5 cursor-pointer sm:hidden'/>
        </div>

        {/* Mobile Menu */}
        <div className={`absolute top-0 right-0 bottom-0 overflow-hidden bg-white transition-all ${visible ? 'w-full' : 'w-0'}`}>
          <div className='flex flex-col text-gray-600'>
            <div onClick={()=>setVisible(false)} className='flex items-center gap-4 p-3 cursor-pointer'>
              <FiArrowLeft />
              <span>Back</span>
            </div>
            <NavLink onClick={()=>setVisible(false)} className="py-2 pl-6 border" to='/'>HOME</NavLink>
            <NavLink onClick={()=>setVisible(false)} className="py-2 pl-6 border" to='/Collection'>COLLECTION</NavLink>
            <NavLink onClick={()=>setVisible(false)} className="py-2 pl-6 border" to='/About'>ABOUT</NavLink>
            <NavLink onClick={()=>setVisible(false)} className="py-2 pl-6 border" to='/Contact'>CONTACT</NavLink>
            {!isAuthenticated && (
              <>
                <NavLink onClick={()=>setVisible(false)} className="py-2 pl-6 border" to='/customerlogin'>CUSTOMER LOGIN</NavLink>
                <NavLink onClick={()=>setVisible(false)} className="py-2 pl-6 border" to='/delivery-login'>DELIVERY MANAGER LOGIN</NavLink>
                <NavLink onClick={()=>setVisible(false)} className="py-2 pl-6 border" to='/delivery-person-login'>DELIVERY PERSON LOGIN</NavLink>
              </>
            )}
          </div>
        </div>
      </div>
    )
}

export default NavBar2