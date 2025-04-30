import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiTruck, FiDollarSign, FiClock, FiDroplet } from 'react-icons/fi';

const DeliveryDetailsList = () => {
    const [deliveryDetails, setDeliveryDetails] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDeliveryDetails();
    }, []);

    const fetchDeliveryDetails = async () => {
        try {
            const token = localStorage.getItem('deliveryManagerToken');
            if (!token) {
                toast.error('Authentication required. Please login again.');
                return;
            }

            const response = await axios.get(
                'http://localhost:5000/api/delivery/manager/delivery-details',
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data && Array.isArray(response.data)) {
                setDeliveryDetails(response.data);
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('Error fetching delivery details:', error);
            if (error.response?.status === 401) {
                toast.error('Session expired. Please login again.');
                localStorage.removeItem('deliveryManagerToken');
            } else if (error.response?.status === 403) {
                toast.error('You do not have permission to view delivery details');
            } else {
                toast.error(error.response?.data?.message || 'Failed to fetch delivery details');
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-6">Delivery Details</h2>
            {deliveryDetails.length === 0 ? (
                <div className="text-center py-8">
                    <FiTruck className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No Delivery Details</h3>
                    <p className="mt-1 text-sm text-gray-500">No delivery details have been submitted yet.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {deliveryDetails.map((detail) => (
                        <div key={detail._id} className="bg-gray-50 rounded-lg p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold">Order #{detail.orderId}</h3>
                                    <p className="text-sm text-gray-500">
                                        Delivered by: {detail.deliveryPerson?.name || 'Unknown'}
                                    </p>
                                </div>
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                    Delivered
                                </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="flex items-center gap-2">
                                    <FiDollarSign className="text-blue-500" />
                                    <div>
                                        <p className="text-sm text-gray-500">Delivery Cost</p>
                                        <p className="font-medium">Rs. {detail.deliveryCost}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FiTruck className="text-blue-500" />
                                    <div>
                                        <p className="text-sm text-gray-500">Mileage</p>
                                        <p className="font-medium">{detail.mileage} km</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FiDroplet className="text-blue-500" />
                                    <div>
                                        <p className="text-sm text-gray-500">Petrol Cost</p>
                                        <p className="font-medium">Rs. {detail.petrolCost}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FiClock className="text-blue-500" />
                                    <div>
                                        <p className="text-sm text-gray-500">Time Spent</p>
                                        <p className="font-medium">{detail.timeSpent} hours</p>
                                    </div>
                                </div>
                            </div>
                            {detail.additionalNotes && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <p className="text-sm text-gray-500">Additional Notes</p>
                                    <p className="mt-1 text-gray-700">{detail.additionalNotes}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DeliveryDetailsList; 