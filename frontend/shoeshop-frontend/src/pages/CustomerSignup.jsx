import React from 'react';
import { useState } from "react";
import { motion } from "framer-motion";
import Input from '../components/Input';
import { Mail, User, Lock, Loader, Phone } from "lucide-react";
import { Link,useNavigate } from "react-router-dom";
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import { useAuthStore } from "../store/authStore";

const CustomerSignup = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const navigate = useNavigate();

    const { signup, error, isLoading } = useAuthStore();

    const handleSignup = async(e)=>{
        e.preventDefault();

        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(phoneNumber)) {
            alert("Phone number must be exactly 10 digits.");
            return;
        }

        if (password.length < 6) {
            alert("Password must be at least 6 characters.");
            return;
        }
        
        try {
			await signup(email, password, name, phoneNumber);
			navigate("/verify-email");
		} catch (error) {
			console.log(error);
		}
    }

  return (
    <div className="flex justify-center items-center min-h-screen font-display">
    <motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
			className='max-w-md w-full  bg-opacity-50 backdrop-filter backdrop-blur-xl rounded-2xl shadow-2xl 
			overflow-hidden'
		>

    <div className='p-8'>
    <div class="flex justify-center p-2">
    			<img src="/images/newlogo.png" alt="" width="100px"/>
			</div>
        <h2 className='text-3xl font-bold mb-6 text-center bg-gradient-to-r from-green-400 to-emerald-500 text-transparent bg-clip-text'>Create Account</h2>
    
    <form onSubmit={handleSignup}>
        <Input
            icon={User}
            type='text'
			placeholder='Full Name'
            value={name}
            onChange={(e) => setName(e.target.value)}
        />
        <Input
            icon={Mail}
            type='email'
			placeholder='Email address'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
        />
        <Input
              icon={Phone}
              type='text'
              placeholder='Phone Number'
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
        />
        <Input
            icon={Lock}
            type='password'
			placeholder='Password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className='text-red-500 font-semibold mt-2'>{error}</p>}
        <PasswordStrengthMeter password={password} />

        <motion.button className='mt-5 w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white 
						font-bold rounded-lg shadow-lg hover:from-green-600
						hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
						 focus:ring-offset-gray-900 transition duration-200'
                         whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
						type='submit'
                        disabled={isLoading}
                         >
        {isLoading ? <Loader className=' animate-spin mx-auto' size={24} /> : "Sign Up"}
        </motion.button>
    </form>
    </div>

    <div className='px-8 py-4 bg-opacity-50 flex justify-center'>
				<p className='text-sm text-gray-400'>
					Already have an account?{" "}
					<Link to={"/customerlogin"} className='text-green-400 hover:underline'>
						Login
					</Link>
				</p>
	</div>

    </motion.div>
    </div>
  )
}

export default CustomerSignup