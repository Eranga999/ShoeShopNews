import { create } from "zustand";
import axios from "axios";

const API_URL = "http://localhost:5000/api/auth";

axios.defaults.withCredentials = true;//enables sending cookies with cross-origin requests

export const useAuthStore = create((set) => ({
	user: JSON.parse(localStorage.getItem("user")) || null,  // Load from localStorage
	isAuthenticated: !!localStorage.getItem("user"),
	isCheckingAuth: true,
	isLoading: false,

	updateUser: (userData) => {
		const updatedUser = { ...JSON.parse(localStorage.getItem("user")), ...userData };
		localStorage.setItem("user", JSON.stringify(updatedUser));
		set({ user: updatedUser });
	},

	signup: async (email, password, name, phoneNumber) => {
		set({ isLoading: true, error: null });
		try {
			const response = await axios.post(`${API_URL}/signup`, { email, password, name, phoneNumber });
			set({ user: response.data.user, isAuthenticated: true, isLoading: false });
		} catch (error) {
			set({ error: error.response.data.message || "Error signing up", isLoading: false });
			throw error;
		}
	},
	login: async (email, password) => {
		set({ isLoading: true, error: null });
		try {
			const response = await axios.post(`${API_URL}/login`, { email, password });
			localStorage.setItem("user", JSON.stringify(response.data.user));
			set({ user: response.data.user, isAuthenticated: true, isLoading: false });
		} catch (error) {
			set({ error: error.response?.data?.message || "Error logging in", isLoading: false });
			throw error;
		}
	},

	logout: async () => {
		set({ isLoading: true, error: null });
		try {
			await axios.post(`${API_URL}/logout`);
			localStorage.removeItem("user");
			set({ user: null, isAuthenticated: false, isLoading: false });
		} catch (error) {
			set({ error: "Error logging out", isLoading: false });
			throw error;
		}
	},
	verifyEmail: async (code) => {
		set({ isLoading: true, error: null });
		try {
			const response = await axios.post(`${API_URL}/verify-email`, { code });
			set({ user: response.data.user, isAuthenticated: true, isLoading: false });
			return response.data;
		} catch (error) {
			set({ error: error.response.data.message || "Error verifying email", isLoading: false });
			throw error;
		}
	},
	checkAuth: async () => {
		set({ isCheckingAuth: true, error: null });
		try {
			const response = await axios.get(`${API_URL}/check-auth`);
			localStorage.setItem("user", JSON.stringify(response.data.user));
			set({ user: response.data.user, isAuthenticated: true, isCheckingAuth: false });
		} catch (error) {
			localStorage.removeItem("user");
			set({ user: null, isAuthenticated: false, isCheckingAuth: false });
		}
	},
	forgotPassword: async (email) => {
		set({ isLoading: true, error: null });
		try {
			const response = await axios.post(`${API_URL}/forgot-password`, { email });
			set({ message: response.data.message, isLoading: false });
		} catch (error) {
			set({
				isLoading: false,
				error: error.response.data.message || "Error sending reset password email",
			});
			throw error;
		}
	},
	resetPassword: async (token, password) => {
		set({ isLoading: true, error: null });
		try {
			const response = await axios.post(`${API_URL}/reset-password/${token}`, { password });
			set({ message: response.data.message, isLoading: false });
		} catch (error) {
			set({
				isLoading: false,
				error: error.response.data.message || "Error resetting password",
			});
			throw error;
		}
	},
	deleteAccount: async () => {
		set({ isLoading: true, error: null });
		try {
			const response = await axios.delete(`${API_URL}/delete-account`);
			
			if (response.data.success) {
				// Clear local storage and reset state
				localStorage.removeItem("user");
				set({ 
					user: null, 
					isAuthenticated: false, 
					isLoading: false,
					message: "Account successfully deleted" 
				});
				return response.data;
			}
		} catch (error) {
			set({ 
				isLoading: false,
				error: error.response?.data?.message || "Error deleting account"
			});
			throw error;
		}
	},
}));