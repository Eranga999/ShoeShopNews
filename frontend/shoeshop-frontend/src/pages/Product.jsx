import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import { toast } from "react-toastify";
import { GoStar } from "react-icons/go";
import "react-toastify/dist/ReactToastify.css";
import { useAuthStore } from '../store/authStore';

const Product = () => {
  const { productId } = useParams();
  const { products, currency } = useContext(ShopContext);
  const [productData, setProductData] = useState(false);
  const [image, setImage] = useState("");
  // const [sizeId, setSizeId] = useState(""); // Store size ID
  const [sizesArray, setSizesArray] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState(""); // Track selected variant ID
  const [selectedSizeId, setSelectedSizeId] = useState(""); // Track selected variant ID
  const [selectedSize, setSelectedSize] = useState(0); // Track selected variant ID
  const [selectedColor, setSelectedColor] = useState(""); // Track selected variant ID
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewImage, setReviewImage] = useState(null);
  const [reviewImageBase64, setReviewImageBase64] = useState(null);

  const [editingReview, setEditingReview] = useState(null);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewData, setReviewData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editedRating, setEditedRating] = useState(0);
  const [editedComment, setEditedComment] = useState("");
  const [editedImageBase64, setEditedImageBase64] = useState(null);
  const [currentReviewId, setCurrentReviewId] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isEditCompressing, setIsEditCompressing] = useState(false);

  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const fetchProductData = async () => {
    axios
      .get(`http://localhost:5000/api/product/${productId}`)
      .then((res) => {
        console.log("res.data is =====> ", res.data);
        setProductData(res.data);
        setImage(res.data.variants[0].imageUrl);
        setSizesArray(res.data.variants[0].sizes);
        setSelectedVariantId(res.data.variants[0]._id); // Set the initial variant ID
        setSelectedColor(res.data.variants[0].color);
      })
      .catch((err) => {
        console.error(err);
      });
  };

  useEffect(() => {
    fetchProductData();
  }, [productId]);

  const onClickImage = (index) => {
    setImage(productData.variants[index].imageUrl);
    setSizesArray(productData.variants[index].sizes);
    setSelectedVariantId(productData.variants[index]._id);
    setSelectedColor(productData.variants[index].color); // Update the variant ID based on clicked image
  };

  const onClickSize = (item) => {
    setSelectedSize(item.size);
    setSelectedSizeId(item._id);
  };

  const handleAddToCart = () => {
    if (!isAuthenticated || !user) {
      toast.error("Please login to add items to cart", {
        position: "top-right",
        autoClose: 3000,
      });
      navigate('/customerlogin');
      return;
    }

    if (!selectedSizeId) {
      toast.error("Please select a size", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    const cartItem = {
      userId: user._id,
      items: [
        {
          brand: {
            brandId: productId,
            brandName: productData.brand,
            modelName: productData.model,
          },
          color: {
            colorId: selectedVariantId,
            colorName: selectedColor,
          },
          size: {
            sizeId: selectedSizeId,
            size: selectedSize,
          },
          quantity: 1,
          imageUrl: image,
          price: productData.price,
        },
      ],
    };

    axios
      .post(`http://localhost:5000/api/cart`, cartItem, {
        withCredentials: true
      })
      .then((res) => {
        console.log(res.data);

        if (res.status >= 200 && res.status < 300) {
          toast.success(res.data.message, {
            position: "top-right",
            autoClose: 3000,
          });
        }
      })
      .catch((err) => {
        console.error(err);
        if (err.response?.status === 401) {
          toast.error('Please login to add items to cart', {
            position: "top-right",
            autoClose: 3000,
          });
          navigate('/customerlogin');
        } else {
          const errorMessage =
            err.response?.data?.message || "Failed to add product to cart";
          toast.error(errorMessage, {
            position: "top-right",
            autoClose: 3000,
          });
        }
      });
  };

  const fetchReviewData = async () => {
    axios
      .get(`http://localhost:5000/api/review`)
      .then((res) => {
        const filteredReviews = res.data.filter(
          (review) => review.brandId === productId
        );
        console.log(filteredReviews);
        setReviewData(filteredReviews);
      })
      .catch((err) => {
        console.error(err);
      });
  };

  useEffect(() => {
    fetchReviewData();
  }, []);

  // Compress and resize image before converting to base64
  const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          // Calculate new dimensions maintaining aspect ratio
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with reduced quality
          const base64 = canvas.toDataURL("image/jpeg", quality);
          resolve(base64);
        };
        img.onerror = error => reject(error);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setIsCompressing(true);
        const compressedBase64 = await compressImage(file);
        setReviewImage(file);
        setReviewImageBase64(compressedBase64);
        setIsCompressing(false);
      } catch (error) {
        console.error("Error processing image:", error);
        toast.error("Failed to process image");
        setIsCompressing(false);
      }
    }
  };

  const handleEditImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setIsEditCompressing(true);
        const compressedBase64 = await compressImage(file);
        setEditedImageBase64(compressedBase64);
        setIsEditCompressing(false);
      } catch (error) {
        console.error("Error processing image:", error);
        toast.error("Failed to process image");
        setIsEditCompressing(false);
      }
    }
  };

  const handleReviewSubmit = () => {
    if (rating === 0 || comment.trim() === "") {
      toast.error("Please provide both a rating and a comment", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    const reviewData = {
      brandId: productId,
      userId: "user128", // Replace with actual user ID
      userFullName: "Jayantha", // Replace with actual user's name
      rating: rating,
      comment: comment,
    };

    // Add the image if available
    if (reviewImageBase64) {
      reviewData.reviewImage = reviewImageBase64;
    }

    axios
      .post("http://localhost:5000/api/review", reviewData)
      .then((res) => {
        toast.success("Review submitted successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
        // Reset form fields
        setRating(0);
        setComment("");
        setReviewImage(null);
        setReviewImageBase64(null);
        fetchReviewData(); // Re-fetch reviews after submission
      })
      .catch((err) => {
        console.error("Error submitting review:", err);
        const errorMsg = err.response?.data?.message || "Failed to submit review";
        toast.error(errorMsg, {
          position: "top-right",
          autoClose: 3000,
        });
      });
  };

  const handleEditClick = (review) => {
    setEditingReview(review);
    setEditedRating(review.rating);
    setEditedComment(review.comment);
    setEditedImageBase64(review.reviewImage || null);
    setIsModalOpen(true);
  };

  const handleUpdateReview = () => {
    if (!editingReview) return;

    const updatedReview = {
      userId: "user128",
      rating: editedRating,
      comment: editedComment,
    };
    
    // Add the image if available
    if (editedImageBase64) {
      updatedReview.reviewImage = editedImageBase64;
    }

    axios
      .put(
        `http://localhost:5000/api/review/${editingReview._id}`,
        updatedReview
      )
      .then((res) => {
        toast.success("Review updated successfully!", { autoClose: 3000 });
        setIsModalOpen(false);
        setEditedImageBase64(null);
        fetchReviewData(); // Refresh reviews
      })
      .catch((err) => {
        console.error("Error updating review:", err);
        const errorMsg = err.response?.data?.message || "Failed to update review";
        toast.error(errorMsg, { autoClose: 3000 });
      });
  };

  const handleDeleteClick = (reviewId) => {
    // Confirm if the user wants to delete the review
    {
      axios
        .delete(`http://localhost:5000/api/review/${reviewId}`)
        .then((res) => {
          toast.success("Review deleted successfully!", {
            position: "top-right",
            autoClose: 3000,
          });
          fetchReviewData(); // Re-fetch the reviews after deletion
        })
        .catch((err) => {
          toast.error("Failed to delete review", {
            position: "top-right",
            autoClose: 3000,
          });
        });
    }
  };

  return productData ? (
    <div className="border-t-2 pt-10 transition-opacity ease-in duration-500 opacity-100 m-8 font-display">
      {/* Product Data */}
      <div className="flex gap-12 sm:gap-12 flex-col sm:flex-row">
        {/* Product Images */}
        <div className="flex-1 flex flex-col-reverse gap-3 sm:flex-row">
          <div className="flex sm:flex-col overflow-x-auto sm:overflow-y-scroll sm:w-[18.7%] w-full gap-2">
            {productData.variants.map((item, index) => (
              <img
                onClick={() => onClickImage(index)}
                src={item.imageUrl}
                key={index}
                className="w-[24%] sm:w-full sm:mb-3 flex-shrink-0 cursor-pointer"
                alt=""
              />
            ))}
          </div>
          <div className="w-full sm:w-[80%]">
            <img className="w-full h-auto" src={image} alt="" />
          </div>
        </div>
        {/* Product Info */}
        <div className="flex-1">
          <h1 className="font-medium text-2xl mt-2">{productData.brand}</h1>
          <p className="mt-5 text-3xl font-medium">{productData.model}</p>
          <p className="mt-5 text-3xl font-medium">
            {currency}
            {productData.price}
          </p>
          <p className="mt-5 text-gray-500 md:w-4/5">
            {productData.description}
          </p>
          <div className="flex flex-col gap-4 my-8">
            <p>Select Size</p>
            <div className="flex gap-2">
              {sizesArray?.map((item, index) => (
                <button
                  onClick={() => onClickSize(item)} // Store size ID
                  className={`py-2 px-4 bg-gray-100 border ${
                    item._id === selectedSizeId
                      ? "border-orange-500"
                      : "border-gray-300"
                  } cursor-pointer`}
                  key={item._id}
                >
                  {item.size}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleAddToCart} // Use the updated handleAddToCart function
            className="bg-black text-white px-8 py-3 text-sm active:bg-gray-700 cursor-pointer"
          >
            ADD TO CART
          </button>
          <hr className="mt-8 sm:w-4/5" />
          <div className="text-sm text-gray-500 mt-5 flex flex-col gap-1">
            <p>100% Original product</p>
            <p>Cash on delivery is available on this product</p>
            <p>Easy return and exchange policy within 7 days</p>
          </div>
        </div>
      </div>
      {/* Reviews */}
      <div className="mt-20">
        <div className="flex">
          <b className="border px-5 py-3 text-sm">Reviews</b>
          <p className="px-5 py-3 text-sm"></p>
        </div>
        <div className="flex flex-col gap-4 border px-6 py-6 text-sm text-gray-500">
          {/*Show revies in this section*/}
          {reviewData && reviewData.length > 0 ? (
            reviewData.map((review) => {
              const localDate = new Date(review.date).toLocaleDateString(
                "en-GB"
              );

              return (
                <div key={review._id} className="border-b pb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={review.profilepicture}
                      alt="Profile"
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-bold">{review.userFullName}</p>
                      <p>
                        <GoStar className="text-yellow-500" /> {review.rating}/5
                      </p>
                      <p className="text-xs text-gray-400">{localDate}</p>
                    </div>
                  </div>

                  {/* Show Edit Button Only for Review Author */}
                  {review.userId === "user128" && (
                    <div className="flex gap-2 mt-2">
                      <button
                        className="bg-blue-500 text-white px-4 py-2 mt-2 rounded"
                        onClick={() => handleEditClick(review)}
                      >
                        Edit
                      </button>

                      <button
                        className="bg-red-500 text-white px-4 py-2 mt-2 rounded"
                        onClick={() => handleDeleteClick(review._id)} // Call delete function
                      >
                        Delete
                      </button>
                    </div>
                  )}

                  <p className="mt-2">{review.comment}</p>

                  {/* Display review image if available */}
                  {review.reviewImage && (
                    <div className="mt-3">
                      <img 
                        src={review.reviewImage} 
                        alt="Review image" 
                        className="max-w-xs rounded-lg shadow-sm"
                      />
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p>No reviews yet.</p>
          )}
        </div>
        <div className="mt-10">
          <div className="flex flex-col gap-4 border px-6 py-6 text-sm text-gray-500 rounded-lg shadow-md">
            <h3 className="text-xl font-medium">Write a Review</h3>
            <div>
              <label className="block mb-2 font-medium">Rating (1-5)</label>
              <input
                type="number"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="5"
              />
            </div>
            <div>
              <label className="block mb-2 font-medium">Comment</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="4"
              />
            </div>
            
            {/* Image Upload Field */}
            <div>
              <label className="block mb-2 font-medium">Upload Image (Optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isCompressing}
              />
              
              {isCompressing && (
                <p className="text-blue-500 mt-1">Compressing image...</p>
              )}
              
              {/* Image Preview */}
              {reviewImageBase64 && !isCompressing && (
                <div className="mt-2">
                  <p className="mb-1 font-medium">Image Preview:</p>
                  <img 
                    src={reviewImageBase64} 
                    alt="Preview" 
                    className="max-w-xs h-auto rounded-lg border border-gray-300"
                  />
                  <button
                    className="mt-2 bg-red-500 text-white px-3 py-1 rounded text-sm"
                    onClick={() => {
                      setReviewImage(null);
                      setReviewImageBase64(null);
                    }}
                  >
                    Remove Image
                  </button>
                </div>
              )}
            </div>
            
            <button
              className={`${
                isCompressing ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
              } text-white px-6 py-2 rounded transition duration-300`}
              onClick={handleReviewSubmit}
              disabled={isCompressing}
            >
              {isCompressing ? "Processing..." : "Submit Review"}
            </button>
          </div>

          {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-w-lg max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-semibold mb-4">Edit Review</h2>

                {/* Rating Input */}
                <label className="block mb-2 font-medium">Rating (1-5)</label>
                <input
                  type="number"
                  value={editedRating}
                  onChange={(e) => setEditedRating(Number(e.target.value))}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="5"
                />

                {/* Comment Input */}
                <label className="block mt-4 mb-2 font-medium">Comment</label>
                <textarea
                  value={editedComment}
                  onChange={(e) => setEditedComment(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="4"
                />
                
                {/* Edit Image Upload */}
                <div className="mt-4">
                  <label className="block mb-2 font-medium">Upload Image (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEditImageUpload}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isEditCompressing}
                  />
                  
                  {isEditCompressing && (
                    <p className="text-blue-500 mt-1">Compressing image...</p>
                  )}
                  
                  {/* Image Preview */}
                  {editedImageBase64 && !isEditCompressing && (
                    <div className="mt-2">
                      <p className="mb-1 font-medium">Image:</p>
                      <img 
                        src={editedImageBase64} 
                        alt="Review image" 
                        className="max-w-full h-auto rounded-lg border border-gray-300"
                      />
                      <button
                        className="mt-2 bg-red-500 text-white px-3 py-1 rounded text-sm"
                        onClick={() => {
                          setEditedImageBase64(null);
                        }}
                      >
                        Remove Image
                      </button>
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex justify-end mt-4">
                  <button
                    className="bg-gray-500 text-white px-4 py-2 rounded mr-2"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className={`${
                      isEditCompressing ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500"
                    } text-white px-4 py-2 rounded`}
                    onClick={handleUpdateReview}
                    disabled={isEditCompressing}
                  >
                    {isEditCompressing ? "Processing..." : "Update"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  ) : (
    <div className="opacity-0"></div>
  );
};

export default Product;