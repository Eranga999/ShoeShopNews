import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    Alert,
} from '@mui/material';
import axios from 'axios';
import { toast } from 'react-toastify';

const DeliverySignup = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        vehicleNumber: '',
        licenseNumber: ''
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Clear any existing tokens
        localStorage.removeItem('deliveryPersonToken');

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            toast.error('Passwords do not match');
            return;
        }

        try {
            console.log('Sending signup request with data:', { ...formData, confirmPassword: undefined });
            
            const response = await axios.post('http://localhost:5000/api/delivery/delivery-person/signup', {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                phone: formData.phone,
                vehicleNumber: formData.vehicleNumber,
                licenseNumber: formData.licenseNumber
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('Signup response:', response.data);

            if (response.data && response.data.token) {
                // Store the token
                localStorage.setItem('deliveryPersonToken', response.data.token);
                
                // Verify token storage
                const storedToken = localStorage.getItem('deliveryPersonToken');
                console.log('Stored token:', storedToken);

                if (storedToken) {
                    toast.success('Registration successful!');
                    navigate('/delivery-person-dashboard');
                } else {
                    throw new Error('Token storage failed');
                }
            } else {
                throw new Error('No token received from server');
            }
        } catch (error) {
            console.error('Signup error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
            setError(errorMessage);
            toast.error(errorMessage);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <Container component="main" maxWidth="xs">
                <Box
                    sx={{
                        marginTop: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
                        <Typography component="h1" variant="h5" align="center" gutterBottom>
                            Delivery Person Sign Up
                        </Typography>
                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}
                        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="name"
                                label="Full Name"
                                name="name"
                                autoComplete="name"
                                autoFocus
                                value={formData.name}
                                onChange={handleChange}
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="email"
                                label="Email Address"
                                name="email"
                                autoComplete="email"
                                value={formData.email}
                                onChange={handleChange}
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="password"
                                label="Password"
                                type="password"
                                id="password"
                                value={formData.password}
                                onChange={handleChange}
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="confirmPassword"
                                label="Confirm Password"
                                type="password"
                                id="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="phone"
                                label="Phone Number"
                                type="tel"
                                id="phone"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="vehicleNumber"
                                label="Vehicle Number"
                                id="vehicleNumber"
                                value={formData.vehicleNumber}
                                onChange={handleChange}
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="licenseNumber"
                                label="License Number"
                                id="licenseNumber"
                                value={formData.licenseNumber}
                                onChange={handleChange}
                            />
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                sx={{ mt: 3, mb: 2 }}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                Sign Up
                            </Button>
                            <Box sx={{ textAlign: 'center' }}>
                                <Link 
                                    to="/delivery-person-login"
                                    className="text-blue-600 hover:text-blue-800"
                                    style={{ textDecoration: 'none' }}
                                >
                                    Already have an account? Sign In
                                </Link>
                            </Box>
                        </Box>
                    </Paper>
                </Box>
            </Container>
        </div>
    );
};

export default DeliverySignup; 