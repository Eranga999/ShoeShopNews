import React, { useState } from 'react';
import { Star, Edit2, Trash2, Plus } from 'lucide-react';

const DeliveryServiceReview = () => {
  const [reviews, setReviews] = useState([]);
  const [editingReview, setEditingReview] = useState(null);
  const [newReview, setNewReview] = useState({
    deliveryPerson: '',
    customer: '',
    rating: 1,
    reviewText: ''
  });

  const addReview = () => {
    if (!newReview.deliveryPerson || !newReview.customer) {
      alert('Please fill in Delivery Person and Customer names');
      return;
    }

    const review = {
      id: Date.now(),
      ...newReview
    };

    setReviews([...reviews, review]);
    
    // Reset form
    setNewReview({
      deliveryPerson: '',
      customer: '',
      rating: 1,
      reviewText: ''
    });
  };

  const startEditReview = (review) => {
    setEditingReview(review);
    setNewReview({
      deliveryPerson: review.deliveryPerson,
      customer: review.customer,
      rating: review.rating,
      reviewText: review.reviewText
    });
  };

  const saveEditedReview = () => {
    if (!editingReview) return;

    const updatedReviews = reviews.map(review => 
      review.id === editingReview.id 
        ? { ...review, ...newReview } 
        : review
    );

    setReviews(updatedReviews);
    setEditingReview(null);
    
    // Reset form
    setNewReview({
      deliveryPerson: '',
      customer: '',
      rating: 1,
      reviewText: ''
    });
  };

  const deleteReview = (id) => {
    setReviews(reviews.filter(review => review.id !== id));
  };

  // Rating star display component
  const RatingStars = ({ rating, className }) => (
    <div className={`flex ${className}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star 
          key={star} 
          className={`w-5 h-5 ${star <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white shadow-2xl rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6">
          <h1 className="text-4xl font-extrabold text-center tracking-tight">
            Delivery Review Hub
          </h1>
          <p className="text-center mt-2 text-blue-100">
             Delivery service feedback
          </p>
        </div>

        {/* Review Form */}
        <div className="p-8">
          <div className="bg-gray-50 rounded-xl p-6 shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
              {editingReview ? (
                <>
                  <Edit2 className="mr-3 text-blue-500" />
                  Edit Review
                </>
              ) : (
                <>
                  <Plus className="mr-3 text-green-500" />
                  Add New Review
                </>
              )}
            </h2>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Delivery Person Name"
                  value={newReview.deliveryPerson}
                  onChange={(e) => setNewReview({
                    ...newReview, 
                    deliveryPerson: e.target.value
                  })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />

                <input
                  type="text"
                  placeholder="Customer Name"
                  value={newReview.customer}
                  onChange={(e) => setNewReview({
                    ...newReview, 
                    customer: e.target.value
                  })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Rating
                </label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setNewReview({...newReview, rating})}
                      className={`px-4 py-2 rounded-md transition ${
                        newReview.rating === rating 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {rating} Star{rating !== 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                placeholder="Review Details"
                value={newReview.reviewText}
                onChange={(e) => setNewReview({
                  ...newReview, 
                  reviewText: e.target.value
                })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />

              <div className="flex space-x-4">
                {editingReview ? (
                  <>
                    <button 
                      onClick={saveEditedReview}
                      className="flex-1 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition transform hover:scale-105 flex items-center justify-center"
                    >
                      <Edit2 className="mr-2" /> Save Changes
                    </button>
                    <button 
                      onClick={() => setEditingReview(null)}
                      className="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition transform hover:scale-105"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={addReview}
                    className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition transform hover:scale-105 flex items-center justify-center"
                  >
                    <Plus className="mr-2" /> Add Review
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              {reviews.length > 0 ? 'Recent Reviews' : 'No Reviews Yet'}
            </h2>

            {reviews.map((review) => (
              <div 
                key={review.id} 
                className="bg-white p-6 rounded-xl shadow-md mb-4 border-l-4 border-blue-500 hover:shadow-lg transition-all duration-300 ease-in-out"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      {review.deliveryPerson}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Reviewed by {review.customer}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => startEditReview(review)}
                      className="text-blue-500 hover:bg-blue-50 p-2 rounded-full transition"
                    >
                      <Edit2 />
                    </button>
                    <button 
                      onClick={() => deleteReview(review.id)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-full transition"
                    >
                      <Trash2 />
                    </button>
                  </div>
                </div>
                
                <RatingStars rating={review.rating} className="mb-3" />
                
                <p className="text-gray-700 mt-2">
                  {review.reviewText}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryServiceReview;