import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

const DeliveryPersonLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        try {
            const response = await axios.post('http://localhost:5000/api/delivery/delivery-person/login', {
                email,
                password
            });

            if (response.data.token) {
                // Store the token
                localStorage.setItem('deliveryPersonToken', response.data.token);
                
                // Store user info if needed
                localStorage.setItem('deliveryPersonInfo', JSON.stringify({
                    id: response.data.deliveryPerson.id,
                    name: response.data.deliveryPerson.name,
                    email: response.data.deliveryPerson.email
                }));

                toast.success('Login successful!');
                navigate('/delivery-person-dashboard');
            } else {
                setError('Invalid login response');
                toast.error('Login failed: Invalid response from server');
            }
        } catch (error) {
            console.error('Login error:', error);
            const errorMessage = error.response?.data?.message || 'Login failed';
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
                        </Box>
                    </Paper>
                </Box>
            </Container>
        </div>
    );
};

export default DeliveryPersonLogin; 