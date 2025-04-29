import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaStar } from "react-icons/fa";
import { toast } from "react-toastify";
import { GoStar } from "react-icons/go";

const ReviewSection = ({ productId }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewImage, setReviewImage] = useState(null);
  const [reviewData, setReviewData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editedRating, setEditedRating] = useState(0);
  const [editedComment, setEditedComment] = useState("");
  const [currentReviewId, setCurrentReviewId] = useState(null);

  useEffect(() => {
    fetchReviewData();
  }, []);

  const fetchReviewData = () => {
    axios
      .get(`http://localhost:5000/api/reviews/${productId}`)
      .then((res) => {
        setReviewData(res.data);
      })
      .catch((err) => {
        console.error("Error fetching reviews:", err);
      });
  };

  const handleReviewSubmit = () => {
    if (rating === 0 || comment.trim() === "") {
      toast.error("Please provide both a rating and a comment", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    const formData = new FormData();
    formData.append("productId", "1235");
    formData.append("userId", "user128");
    formData.append("userFullName", "Jayantha");
    formData.append("rating", rating);
    formData.append("comment", comment);
    if (reviewImage) {
      formData.append("image", reviewImage);
    }

    axios
      .post("http://localhost:5000/api/review", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => {
        toast.success("Review submitted successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
        fetchReviewData(); // Refresh reviews
        setRating(0);
        setComment("");
        setReviewImage(null);
      })
      .catch((err) => {
        toast.error("Failed to submit review", {
          position: "top-right",
          autoClose: 3000,
        });
      });
  };

  const handleEditClick = (review) => {
    setIsModalOpen(true);
    setCurrentReviewId(review._id);
    setEditedRating(review.rating);
    setEditedComment(review.comment);
  };

  const handleUpdateReview = () => {
    if (editedRating === 0 || editedComment.trim() === "") {
      toast.error("Please provide both a rating and a comment", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    axios
      .put(`http://localhost:5000/api/reviews/${currentReviewId}`, {
        rating: editedRating,
        comment: editedComment,
      })
      .then((res) => {
        toast.success("Review updated successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
        fetchReviewData(); // Refresh reviews
        setIsModalOpen(false);
      })
      .catch((err) => {
        toast.error("Failed to update review", {
          position: "top-right",
          autoClose: 3000,
        });
      });
  };

  const handleDeleteClick = (reviewId) => {
    axios
      .delete(`http://localhost:5000/api/reviews/${reviewId}`)
      .then((res) => {
        toast.success("Review deleted successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
        fetchReviewData(); // Refresh reviews
      })
      .catch((err) => {
        toast.error("Failed to delete review", {
          position: "top-right",
          autoClose: 3000,
        });
      });
  };

  return (
    <div className="mt-20">
      <div className="flex">
        <b className="border px-5 py-3 text-sm">Reviews</b>
        <p className="px-5 py-3 text-sm"></p>
      </div>
      <div className="flex flex-col gap-4 border px-6 py-6 text-sm text-gray-500">
        {/* Show reviews in this section */}
        {reviewData && reviewData.length > 0 ? (
          reviewData.map((review) => {
            const localDate = new Date(review.date).toLocaleDateString("en-GB");

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
                {review.imageUrl && (
                  <img
                    src={`http://localhost:5000${review.imageUrl}`}
                    alt="Review"
                    className="mt-2 w-40 h-auto rounded border"
                  />
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
          <div>
            <label className="block mb-2 font-medium">Upload a Photo (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setReviewImage(e.target.files[0])}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition duration-300"
            onClick={handleReviewSubmit}
          >
            Submit Review
          </button>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-opacity-80 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
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

              {/* Buttons */}
              <div className="flex justify-end mt-4">
                <button
                  className="bg-gray-500 text-white px-4 py-2 rounded mr-2"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                  onClick={handleUpdateReview}
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewSection;
