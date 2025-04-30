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

const DeliveryLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // First clear any existing tokens
            localStorage.removeItem('deliveryPersonToken');
            
            const response = await axios.post('http://localhost:5000/api/delivery/delivery-person/login', {
                email,
                password
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('Login response:', response.data); // For debugging

            if (response.data && response.data.token) {
                // Store the token
                localStorage.setItem('deliveryPersonToken', response.data.token);
                toast.success('Login successful!');
                
                // Verify token is stored
                const storedToken = localStorage.getItem('deliveryPersonToken');
                console.log('Stored token:', storedToken); // For debugging
                
                if (storedToken) {
                    navigate('/delivery-person-dashboard');
                } else {
                    throw new Error('Token storage failed');
                }
            } else {
                throw new Error('No token received from server');
            }
        } catch (error) {
            console.error('Login error:', error); // For debugging
            const errorMessage = error.response?.data?.message || error.message || 'Login failed';
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
                            Delivery Person Login
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
                                id="email"
                                label="Email Address"
                                name="email"
                                autoComplete="email"
                                autoFocus
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="password"
                                label="Password"
                                type="password"
                                id="password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                sx={{ mt: 3, mb: 2 }}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                Sign In
                            </Button>
                            <Box sx={{ textAlign: 'center' }}>
                                <Link to="/delivery-signup" className="text-blue-600 hover:text-blue-800">
                                    Don't have an account? Sign Up
                                </Link>
                            </Box>
                        </Box>
                    </Paper>
                </Box>
            </Container>
        </div>
    );
};

export default DeliveryLogin; 