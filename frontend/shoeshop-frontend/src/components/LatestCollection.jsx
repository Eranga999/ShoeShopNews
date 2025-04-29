import React, { useState, useEffect } from "react";
import axios from "axios";
import ProductItem from "./ProductItem.jsx";
import Title from "../components/Title.jsx";

const LatestCollection = () => {
    const [latestProducts, setLatestProducts] = useState([]);

    useEffect(() => {
        axios.get("http://localhost:5000/api/product/")
            .then((res) => {
                const productsData = res.data;
                const sortedProducts = productsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sorting by latest
                setLatestProducts(sortedProducts.slice(0, 5)); // Get the first 5 latest products
            })
            .catch((err) => {
                console.error("Error fetching latest products:", err);
            });
    }, []);

    return (
        <div className="my-10 m-8 font-display">
            <div className="text-center py-8 text-3xl">
                <Title text1="Latest" text2="Collection" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6">
                {latestProducts.map((item, index) => (
                    <ProductItem 
                        key={index} 
                        id={item._id} 
                        image={item.variants[0]?.imageUrl} 
                        name={item.brand} 
                        price={item.price} 
                    />
                ))}
            </div>
        </div>
    );
};

export default LatestCollection;



