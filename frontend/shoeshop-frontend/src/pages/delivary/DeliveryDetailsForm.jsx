import React, { useState } from 'react';
import { FiDollarSign, FiTruck, FiDroplet, FiClock, FiSend } from 'react-icons/fi';
import axios from 'axios';
import { toast } from 'react-toastify';

const DeliveryDetailsForm = ({ orderId, onSubmit, onClose }) => {
    const [details, setDetails] = useState({
        deliveryCost: '',
        mileage: '',
        petrolCost: '',
        timeSpent: '',
        additionalNotes: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            const token = localStorage.getItem('deliveryPersonToken');
            if (!token) {
                toast.error('Authentication required. Please login again.');
                onClose && onClose();
                return;
            }

            // Validate numeric fields
            const numericFields = ['deliveryCost', 'mileage', 'petrolCost', 'timeSpent'];
            for (const field of numericFields) {
                if (!details[field] || isNaN(details[field]) || Number(details[field]) <= 0) {
                    toast.error(`Please enter a valid ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
                    setIsSubmitting(false);
                    return;
                }
            }

            const response = await axios.post(
                `http://localhost:5000/api/delivery/delivery-person/orders/${orderId}/details`,
                {
                    deliveryCost: Number(details.deliveryCost),
                    mileage: Number(details.mileage),
                    petrolCost: Number(details.petrolCost),
                    timeSpent: Number(details.timeSpent),
                    additionalNotes: details.additionalNotes || ''
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                toast.success('Delivery details submitted successfully');
                onSubmit && onSubmit(response.data.details);
                onClose && onClose();
            } else {
                throw new Error(response.data.message || 'Failed to submit delivery details');
            }
        } catch (error) {
            console.error('Error submitting delivery details:', error);
            if (error.response?.status === 401) {
                toast.error('Session expired. Please login again.');
                localStorage.removeItem('deliveryPersonToken');
                onClose && onClose();
            } else if (error.response?.status === 404) {
                toast.error('Order not found or you do not have permission to submit details for this order.');
            } else {
                toast.error(error.response?.data?.message || 'Failed to submit delivery details');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6">Submit Delivery Details</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            <div className="flex items-center gap-2">
                                <FiDollarSign />
                                Delivery Cost (Rs.)
                            </div>
                        </label>
                        <input
                            type="number"
                            value={details.deliveryCost}
                            onChange={(e) => setDetails({ ...details, deliveryCost: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2"
                            required
                            min="0"
                            step="0.01"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            <div className="flex items-center gap-2">
                                <FiTruck />
                                Mileage (km)
                            </div>
                        </label>
                        <input
                            type="number"
                            value={details.mileage}
                            onChange={(e) => setDetails({ ...details, mileage: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2"
                            required
                            min="0"
                            step="0.1"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            <div className="flex items-center gap-2">
                                <FiDroplet />
                                Petrol Cost (Rs.)
                            </div>
                        </label>
                        <input
                            type="number"
                            value={details.petrolCost}
                            onChange={(e) => setDetails({ ...details, petrolCost: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2"
                            required
                            min="0"
                            step="0.01"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            <div className="flex items-center gap-2">
                                <FiClock />
                                Time Spent (hours)
                            </div>
                        </label>
                        <input
                            type="number"
                            value={details.timeSpent}
                            onChange={(e) => setDetails({ ...details, timeSpent: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2"
                            required
                            min="0"
                            step="0.5"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Additional Notes
                    </label>
                    <textarea
                        value={details.additionalNotes}
                        onChange={(e) => setDetails({ ...details, additionalNotes: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2"
                        rows="3"
                        placeholder="Enter any additional notes about the delivery..."
                    />
                </div>
                <div className="flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isSubmitting}
                    >
                        <FiSend />
                        {isSubmitting ? 'Submitting...' : 'Submit Details'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default DeliveryDetailsForm; 