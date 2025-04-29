import React, { useContext, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FiSearch,FiUser,FiShoppingCart,FiMenu,FiArrowLeft, FiTruck } from "react-icons/fi";
import { Link } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from "react-router-dom";

const NavBar2 = () => {
    const [visible,setVisible]=useState(false);

    const {getCartCount} = useContext(ShopContext);

    const { isAuthenticated, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = ()=>{
      logout()
      navigate("/customerlogin");
    }

    const navigateorders =()=>{
      navigate("/orders");
    }
    
    return (
      <div className='flex items-center justify-between py-5 font-medium ml-10 mr-10 text-lg font-display'>
        <Link to="/"><span className='text-xl w-36'><img src=''/> Shoe Paradise</span></Link>

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
                <Link 
                  to="/delivery-login" 
                  className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm hover:bg-blue-700 transition-colors duration-300 flex items-center gap-2"
                >
                  <FiTruck className="w-4" />
                  <span>Delivery Login</span>
                </Link>
              </>
            ) : (
              <div className='group relative'>
                <FiUser className="w-5 cursor-pointer"/>
                <div className='group-hover:block hidden absolute dropdown-menu right-0 pt-4'>
                  <div className='flex flex-col gap-2 w-36 py-3 px-5 bg-slate-100 text-gray-500 rounded'>
                    <Link to="/customerdashboard"><p className='cursor-pointer hover:text-black'>My Profile</p></Link>
                    <p className='cursor-pointer hover:text-black' onClick={navigateorders}>Orders</p>
                    <p className='cursor-pointer hover:text-black'>WishList</p>
                    <p onClick={handleLogout} className='cursor-pointer hover:text-black'>Logout</p>
                  </div>
                </div>
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
                <NavLink onClick={()=>setVisible(false)} className="py-2 pl-6 border" to='/delivery-login'>DELIVERY LOGIN</NavLink>
              </>
            )}
          </div>
        </div>
      </div>
    )
}

export default NavBar2