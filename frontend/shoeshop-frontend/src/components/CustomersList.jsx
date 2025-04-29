import React, { useState, useEffect } from 'react'
import axios from "axios";

const CustomersList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
  
    useEffect(() => {
      fetchUsers();
    }, []);
    
    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/users/');
        setUsers(response.data.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch users');
        setLoading(false);
        console.error('Error fetching users:', err);
      }
    };

    const handleDeleteClick = (user) => {
        setUserToDelete(user);
        setShowDeleteModal(true);
      };
      
      const cancelDelete = () => {
        setUserToDelete(null);
        setShowDeleteModal(false);
        setDeleteError(null);
      };
      
      const confirmDelete = async () => {
        if (!userToDelete) return;
        
        setDeleteLoading(true);
        setDeleteError(null);
        
        try {
          await axios.delete(`http://localhost:5000/api/users/${userToDelete._id}`);
          
          // Remove user from the state
          setUsers(users.filter(user => user._id !== userToDelete._id));
          
          // Close modal and reset
          setUserToDelete(null);
          setShowDeleteModal(false);
          setDeleteLoading(false);
        } catch (err) {
          setDeleteError('Failed to delete user. Please try again.');
          setDeleteLoading(false);
          console.error('Error deleting user:', err);
        }
      };
    
  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Users</h2>
        <div className="text-sm text-gray-600">Total: {users.length} Customers</div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-100 text-left text-gray-700">
            <tr>
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user, index) => (
              <tr key={user._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-600">{index + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{user.name}</td>
                <td className="px-4 py-3 text-gray-600">{user.email}</td>
                <td className="px-4 py-3 text-gray-600">{user.phoneNumber}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center space-x-2">
                    {/*
                    <button 
                      className="bg-blue-500 hover:bg-blue-600 text-white p-1 rounded"
                      title="View Details"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    
                    <button 
                      className="bg-yellow-500 hover:bg-yellow-600 text-white p-1 rounded"
                      title="Edit User"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>*/}
                    <button 
                      className="bg-red-500 hover:bg-red-600 text-white p-1 rounded"
                      title="Delete User"
                      onClick={() => handleDeleteClick(user)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            
            {users.length === 0 && (
              <tr>
                <td colSpan="5" className="px-4 py-6 text-center text-gray-500">
                  No users found in the system.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {showDeleteModal && (
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                        Delete User
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Are you sure you want to delete this user? This action cannot be undone.
                        </p>
                        {deleteError && (
                          <div className="mt-2 text-sm text-red-600">
                            {deleteError}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={confirmDelete}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? 'Deleting...' : 'Delete'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={cancelDelete}
                    disabled={deleteLoading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}

export default CustomersList