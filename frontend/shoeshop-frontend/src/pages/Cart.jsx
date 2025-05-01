import React, { useState, useContext, useEffect } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from "../components/Title.jsx";
//import CartTotal from '../components/CartTotal.jsx';
import { MdDelete } from "react-icons/md";
import { HiOutlinePlusCircle } from "react-icons/hi";
import { HiOutlineMinusCircle } from "react-icons/hi";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

const Cart = () => {
    const { currency } = useContext(ShopContext);
    const [cartData, setCartData] = useState({ items: [] });
    const [loading, setLoading] = useState(true);
    const [totalprice, setTotal] = useState(0);
    const { user, isAuthenticated } = useAuthStore();
    const DELIVERY_FEE = 200;
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthenticated || !user) {
            navigate('/customerlogin');
            return;
        }
        fetchCart();
    }, [isAuthenticated, user, navigate]);

    const fetchCart = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/cart/${user._id}`, {
                withCredentials: true
            });
            console.log('Cart data:', response.data);
            if (response.data && response.data.items) {
                setCartData(response.data);
            } else {
                setCartData({ items: [] });
            }
        } catch (error) {
            console.error("Error fetching cart:", error);
            if (error.response?.status === 401) {
                toast.error('Please login to view your cart');
                navigate('/customerlogin');
            } else if (error.response?.status === 404) {
                // Cart not found is a normal state for new users
                setCartData({ items: [] });
            } else {
                toast.error("Failed to fetch cart");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleQuantityChange = async (index, newQuantity) => {
        if (newQuantity < 1) return;

        const item = cartData.items[index];
        const itemToUpdate = {
            userId: user._id,
            item: {
                brand: item.brand,
                color: item.color,
                size: item.size,
                price: item.price,
                quantity: newQuantity
            }
        };

        try {
            const response = await axios.put(`http://localhost:5000/api/cart/${user._id}`, itemToUpdate, {
                withCredentials: true
            });
            if (response.data.updatedCart) {
                setCartData(response.data.updatedCart);
            }
        } catch (error) {
            console.error("Error updating quantity:", error);
            if (error.response?.status === 401) {
                toast.error('Please login to update your cart');
                navigate('/customerlogin');
            } else {
                toast.error(error.response?.data?.message || "Failed to update quantity");
            }
        }
    };

    const handleDelete = async (index, item) => {
        const itemToDelete = {
            brandId: item.brand.brandId,
            colorId: item.color.colorId,
            sizeId: item.size.sizeId
        };

        try {
            const response = await axios.delete(`http://localhost:5000/api/cart/${user._id}`, {
                withCredentials: true,
                data: itemToDelete
            });
            if (response.data.cart) {
                setCartData(response.data.cart);
                toast.success("Item removed from cart");
            }
        } catch (error) {
            console.error("Error deleting item:", error);
            if (error.response?.status === 401) {
                toast.error('Please login to remove items from your cart');
                navigate('/customerlogin');
            } else {
                toast.error("Failed to remove item");
            }
        }
    };

    useEffect(() => {
        calculateTotal();
    }, [cartData.items]);
    
    const calculateTotal = () => {
        if (!cartData.items || cartData.items.length === 0) {
            setTotal(0);
            return;
        }
    
        const subtotal = cartData.items.reduce((acc, item) => {
            return acc + (item.price * item.quantity);
        }, 0);
    
        setTotal(subtotal + DELIVERY_FEE);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className='border-t pt-14 m-8 font-display'>
            <div className='tex-2xl mb-3'>
                <Title text1="YOUR" text2="CART" />
            </div>
            <div>
                {(!cartData.items || cartData.items.length === 0) ? (
                    <div className="text-center py-10">
                        <p className="text-gray-500 text-lg">Your cart is empty.</p>
                        <button 
                            onClick={() => navigate('/')} 
                            className="mt-4 bg-black text-white px-6 py-2 rounded hover:bg-gray-800"
                        >
                            Continue Shopping
                        </button>
                    </div>
                ) : (
                    cartData.items.map((item, index) => (
                        <div key={index} className='py-4 border-t border-b text-gray-700 grid grid-cols-[4fr_0.5fr_0.5fr] sm:grid-cols-[4fr_2fr_0.5fr] items-center gap-4'>
                            <div className='flex items-start gap-6'>
                                <img className='w-16 sm:w-20' src={item.imageUrl} alt={item.brand.modelName} />
                                <div>
                                    <p className='text-xs sm:text-lg font-medium'>{item.brand.modelName}</p>
                                    <div className='flex items-center gap-5 mt-2'>
                                        <p>{currency}{item.price}</p>
                                        <p className='px-2 sm:px-3 sm:py-1 border bg-slate-50'>{item.size.size}</p>
                                    </div>
                                </div>
                            </div>
                            <div className='flex gap-2'>
                                <HiOutlineMinusCircle 
                                    className='w-5 mr-4 sm:w-5 cursor-pointer' 
                                    onClick={() => handleQuantityChange(index, item.quantity - 1)}
                                />
                                <input 
                                    className="border max-w-10 sm:max-w-20 px-1 sm:px-2 py-1" 
                                    type="number" 
                                    value={item.quantity}
                                    min="1"
                                    onChange={(e) => handleQuantityChange(index, parseInt(e.target.value))}
                                />
                                <HiOutlinePlusCircle 
                                    className='w-5 mr-4 sm:w-5 cursor-pointer' 
                                    onClick={() => handleQuantityChange(index, item.quantity + 1)}
                                />
                            </div>
                            <MdDelete 
                                className='w-5 mr-4 sm:w-5 cursor-pointer' 
                                onClick={() => handleDelete(index, item)}
                            />
                        </div>
                    ))
                )}
            </div>

            {cartData.items && cartData.items.length > 0 && (
                <div className='flex justify-end my-20'>
                    <div className='w-full sm:w-[450px]'>
                        <div className='w-full'>
                            <div className='text-2xl'>
                                <Title text1={'CART'} text2={'TOTAL'}/>
                            </div>
                            <div className='flex flex-col gap-2 mt-2 text-sm'>
                                <div className='flex justify-between'>
                                    <p>Subtotal</p>
                                    <p>{currency}{totalprice > 0 ? totalprice - DELIVERY_FEE : 0}</p>
                                </div>
                                <hr/>
                                <div className='flex justify-between'>
                                    <p>Shipping Fee</p>
                                    <p>{currency}{DELIVERY_FEE}</p>
                                </div>
                                <hr/>
                                <div className='flex justify-between'>
                                    <b>Total</b>
                                    <b>{currency}{totalprice}</b>
                                </div>
                                <div className='w-full text-end'>
                                    <button 
                                        onClick={() => navigate('/placeOrder')} 
                                        className='bg-black text-white cursor-pointer text-sm my-8 px-8 py-3 hover:bg-gray-800 transition-colors'
                                    >
                                        PROCEED TO CHECKOUT
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cart;


