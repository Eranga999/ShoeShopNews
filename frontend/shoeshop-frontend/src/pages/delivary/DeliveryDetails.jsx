import React, { useState } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import {Link} from 'react-router-dom'

const DeliveryDetails = () => {
  // State for form data
  const [formData, setFormData] = useState({
    name: '',
    nic: '',
    totalTrips: '',
    mileage: '',
    deliveryCost: ''
  });

  // State for validation errors
  const [errors, setErrors] = useState({});

  // State for list of delivery persons
  const [deliveryPersons, setDeliveryPersons] = useState([]);

  // State for editing
  const [editingId, setEditingId] = useState(null);

  // Validation regex
  const nameRegex = /^[A-Za-z\s]{3,}$/; // Only letters, minimum 3 characters
  const nicRegex = /^\d{12}$/; // Exactly 12 digits

  // Validate form fields
  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (!nameRegex.test(formData.name)) {
      newErrors.name = 'Name must be at least 3 characters long and contain only letters';
    }

    // NIC validation
    if (!formData.nic.trim()) {
      newErrors.nic = 'NIC is required';
    } else if (!nicRegex.test(formData.nic)) {
      newErrors.nic = 'NIC must be exactly 12 digits';
    }

    if (!formData.totalTrips) {
      newErrors.totalTrips = 'Total trips is required';
    } else if (parseInt(formData.totalTrips) < 0) {
      newErrors.totalTrips = 'Total trips must be positive';
    }

    if (!formData.mileage) {
      newErrors.mileage = 'Mileage is required';
    } else if (parseFloat(formData.mileage) < 0) {
      newErrors.mileage = 'Mileage must be positive';
    }

    if (!formData.deliveryCost) {
      newErrors.deliveryCost = 'Delivery cost is required';
    } else if (parseFloat(formData.deliveryCost) < 0) {
      newErrors.deliveryCost = 'Delivery cost must be positive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      if (editingId !== null) {
        // Update existing record
        setDeliveryPersons(prev => 
          prev.map(person => 
            person.id === editingId 
              ? { ...formData, id: editingId } 
              : person
          )
        );
        setEditingId(null);
      } else {
        // Add new record
        const newPerson = {
          ...formData,
          id: Date.now() // Simple unique ID generation
        };
        setDeliveryPersons(prev => [...prev, newPerson]);
      }

      // Reset form
      setFormData({
        name: '',
        nic: '',
        totalTrips: '',
        mileage: '',
        deliveryCost: ''
      });
    }
  };

  // Handle edit
  const handleEdit = (person) => {
    setFormData(person);
    setEditingId(person.id);
  };

  // Handle delete
  const handleDelete = (id) => {
    setDeliveryPersons(prev => prev.filter(person => person.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white shadow-2xl rounded-xl overflow-hidden">
        {/* Form Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6">
          <h2 className="text-3xl font-extrabold text-white text-center flex items-center justify-center gap-4">
            {editingId ? 'Edit Delivery Details' : 'Delivery Details'}
          </h2>
        </div>

        {/* Form Container */}
        <div className="p-8 space-y-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name Input */}
            <div className="col-span-2 md:col-span-1">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg transition duration-300 ${
                  errors.name 
                    ? 'border-red-500 focus:ring-2 focus:ring-red-200' 
                    : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                }`}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1 animate-pulse">{errors.name}</p>
              )}
            </div>

            {/* NIC Input */}
            <div className="col-span-2 md:col-span-1">
              <label htmlFor="nic" className="block text-sm font-medium text-gray-700 mb-2">
                NIC
              </label>
              <input
                type="text"
                id="nic"
                name="nic"
                value={formData.nic}
                onChange={handleChange}
                placeholder="Enter 12-digit NIC"
                className={`w-full px-4 py-2 border rounded-lg transition duration-300 ${
                  errors.nic 
                    ? 'border-red-500 focus:ring-2 focus:ring-red-200' 
                    : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                }`}
              />
              {errors.nic && (
                <p className="text-red-500 text-xs mt-1 animate-pulse">{errors.nic}</p>
              )}
            </div>

            {/* Total Trips Input */}
            <div>
              <label htmlFor="totalTrips" className="block text-sm font-medium text-gray-700 mb-2">
                Total Trips
              </label>
              <input
                type="number"
                id="totalTrips"
                name="totalTrips"
                value={formData.totalTrips}
                onChange={handleChange}
                min="0"
                className={`w-full px-4 py-2 border rounded-lg transition duration-300 ${
                  errors.totalTrips 
                    ? 'border-red-500 focus:ring-2 focus:ring-red-200' 
                    : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                }`}
              />
              {errors.totalTrips && (
                <p className="text-red-500 text-xs mt-1 animate-pulse">{errors.totalTrips}</p>
              )}
            </div>

            {/* Mileage Input */}
            <div>
              <label htmlFor="mileage" className="block text-sm font-medium text-gray-700 mb-2">
                Mileage
              </label>
              <input
                type="number"
                id="mileage"
                name="mileage"
                value={formData.mileage}
                onChange={handleChange}
                min="0"
                step="0.1"
                className={`w-full px-4 py-2 border rounded-lg transition duration-300 ${
                  errors.mileage 
                    ? 'border-red-500 focus:ring-2 focus:ring-red-200' 
                    : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                }`}
              />
              {errors.mileage && (
                <p className="text-red-500 text-xs mt-1 animate-pulse">{errors.mileage}</p>
              )}
            </div>

            {/* Delivery Cost Input */}
            <div>
              <label htmlFor="deliveryCost" className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Cost (Rs.)
              </label>
              <input
                type="number"
                id="deliveryCost"
                name="deliveryCost"
                value={formData.deliveryCost}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={`w-full px-4 py-2 border rounded-lg transition duration-300 ${
                  errors.deliveryCost 
                    ? 'border-red-500 focus:ring-2 focus:ring-red-200' 
                    : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                }`}
              />
              {errors.deliveryCost && (
                <p className="text-red-500 text-xs mt-1 animate-pulse">{errors.deliveryCost}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="col-span-2 mt-4">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-lg 
                hover:from-blue-600 hover:to-indigo-700 transition duration-300 
                transform hover:scale-105 flex items-center justify-center gap-2"
              >
                {editingId ? 'Save' : 'Submit'}
              </button>
            </div>
          </form>
        </div>

        {/* Delivery Persons List */}
        {deliveryPersons.length > 0 && (
          <div className="p-8 bg-gray-50 border-t">
            <h3 className="text-2xl font-bold mb-6 text-gray-800 text-center">
              Delivery Persons
            </h3>
            <div className="space-y-4">
              {deliveryPersons.map((person) => (
                <div 
                  key={person.id} 
                  className="bg-white border border-gray-200 rounded-lg p-4 shadow-md 
                  hover:shadow-lg transition duration-300 flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold text-gray-800 text-lg">{person.name}</p>
                    <p className="text-sm text-gray-600">NIC: {person.nic}</p>
                    <div className="text-sm text-gray-500 mt-1">
                      <span className="mr-3">Trips: {person.totalTrips}</span>
                      <span className="mr-3">Mileage: {person.mileage}</span>
                      <span>Cost: Rs. {person.deliveryCost}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(person)}
                      className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 
                      transition duration-300 transform hover:scale-110"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(person.id)}
                      className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 
                      transition duration-300 transform hover:scale-110"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className='flex justify-end p-8'>
        <Link to="/">
           <button className='p-4 bg-blue-800 hover:bg-blue-700 rounded-lg text-white'>Order Status</button>
        </Link>
      </div>
    </div>
  );
};

export default DeliveryDetails;