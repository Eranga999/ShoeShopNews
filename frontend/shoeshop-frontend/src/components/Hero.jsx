import React from 'react'
import homeshoe from '../assets/shoe1.png'
import { Link } from 'react-router-dom';

const Hero = () => {
    return (
      <div className="flex flex-col md:flex-row items-center justify-between px-10 py-20 bg-white">
        {/* Left Section */}
        <div className="md:w-1/2 text-center md:text-left">
          <h1 className="text-5xl font-bold leading-tight">
            YOUR FEET <br /> DESERVE <br /> THE BEST
          </h1>
          <p className="text-gray-600 mt-4">
          Your feet deserve the best, and we're here to provide it! Explore our premium collection of shoes designed for comfort, durability, and fashion. Find your perfect pair today!"
          </p>
          <div className="mt-6 flex gap-4 justify-center md:justify-start">
            <Link to='/Collection'>
            <button className="bg-red-500 cursor-pointer text-white px-6 py-2 rounded-lg shadow-lg hover:bg-red-600">
              Shop Now
            </button>
            </Link>
            
          </div>
          <p className="mt-4 text-gray-500">Walk with Confidence - Find Your Pair!</p>
          
        </div>
        {/* Right Section */}
        <div className="md:w-1/2 flex justify-center mt-10 md:mt-0">
          <img src={homeshoe} alt="Nike Shoe" className="w-120 drop-shadow-lg" />
        </div>
      </div>
    );
  };
  
  export default Hero;
  