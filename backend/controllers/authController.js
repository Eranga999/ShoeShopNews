import {User} from "../modeles/user.model.js";
import bcryptjs from "bcryptjs";
import crypto from "crypto";
import {generateTokenAndSetCookie} from "../utils/generateTokenAndSetCookie.js"
import { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail, sendResetSuccessEmail } from "../mailtrap/emails.js";

export const signup = async (req, res)=>{
    const { email, password, name, phoneNumber } = req.body;
    try {
		if (!email || !password || !name || !phoneNumber) {
			throw new Error("All fields are required");
		}

		const userAlreadyExists = await User.findOne({ email });
		console.log("userAlreadyExists", userAlreadyExists);

		if (userAlreadyExists) {
			return res.status(400).json({ success: false, message: "User already exists" });
		}

		const hashedPassword = await bcryptjs.hash(password, 10);
		const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

		const user = new User({
			email,
			password: hashedPassword,
			name,
			phoneNumber,
			verificationToken,
			verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
		});

		await user.save();

		// jwt
		generateTokenAndSetCookie(res, user._id);

		await sendVerificationEmail(user.email, verificationToken);

		res.status(201).json({
			success: true,
			message: "User created successfully",
			user: {
				...user._doc,
				userId: user._id,
				password: undefined
			},
		});
	} catch (error) {
		res.status(400).json({ success: false, message: error.message });
	}
}

export const verifyEmail = async(req, res)=>{
	const { code } = req.body;
	try {
		const user = await User.findOne({
			verificationToken: code,
			verificationTokenExpiresAt: { $gt: Date.now() },
		});

		if (!user) {
			return res.status(400).json({ success: false, message: "Invalid or expired verification code" });
		}

		user.isVerified = true;
		user.verificationToken = undefined;
		user.verificationTokenExpiresAt = undefined;
		await user.save();

		await sendWelcomeEmail(user.email, user.name);

		res.status(200).json({
			success: true,
			message: "Email verified successfully",
			user: {
				...user._doc,
				password: undefined,
			},
		});
	} catch (error) {
		console.log("error in verifyEmail ", error);
		res.status(500).json({ success: false, message: "Server error" });
	}
}

export const login = async (req, res)=>{
    const { email, password } = req.body;
	try {
		const user = await User.findOne({ email });
		if (!user) {
			return res.status(400).json({ success: false, message: "Invalid email" });
		}
		if (!user.isVerified) {
            return res.status(400).json({ success: false, message: "Please verify your email first" });
        }
		const isPasswordValid = await bcryptjs.compare(password, user.password);
		if (!isPasswordValid) {
			return res.status(400).json({ success: false, message: "Invalid password" });
		}

		generateTokenAndSetCookie(res, user._id);

		user.lastLogin = new Date();
		await user.save();

		res.status(200).json({
			success: true,
			message: "Logged in successfully",
			user: {
				...user._doc,
				userId: user._id,
				password: undefined,
			},
		});
	} catch (error) {
		console.log("Error in login ", error);
		res.status(400).json({ success: false, message: error.message });
	}
}

export const logout = async (req, res)=>{
    res.clearCookie("token");
	res.status(200).json({ success: true, message: "Logged out successfully" });
}

export const forgotPassword = async(req, res)=>{
	const { email } = req.body;
	try {
		const user = await User.findOne({ email });

		if (!user) {
			return res.status(400).json({ success: false, message: "User not found" });
		}

		// Generate reset token
		const resetToken = crypto.randomBytes(20).toString("hex");
		const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000; // 1 hour

		user.resetPasswordToken = resetToken;
		user.resetPasswordExpiresAt = resetTokenExpiresAt;

		await user.save();

		// send email
		await sendPasswordResetEmail(user.email, `${process.env.CLIENT_URL}/reset-password/${resetToken}`);

		res.status(200).json({ success: true, message: "Password reset link sent to your email" });
	} catch (error) {
		console.log("Error in forgotPassword ", error);
		res.status(400).json({ success: false, message: error.message });
	}
}

export const resetPassword = async(req, res)=>{
	try {
		const { token } = req.params;
		const { password } = req.body;

		const user = await User.findOne({
			resetPasswordToken: token,
			resetPasswordExpiresAt: { $gt: Date.now() },
		});

		if (!user) {
			return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
		}

		// update password
		const hashedPassword = await bcryptjs.hash(password, 10);

		user.password = hashedPassword;
		user.resetPasswordToken = undefined;
		user.resetPasswordExpiresAt = undefined;
		await user.save();

		await sendResetSuccessEmail(user.email);

		res.status(200).json({ success: true, message: "Password reset successful" });
	} catch (error) {
		console.log("Error in resetPassword ", error);
		res.status(400).json({ success: false, message: error.message });
	}
}

export const checkAuth = async(req, res)=>{
	try {
		const user = await User.findById(req.userId).select("-password");
		if (!user) {
			return res.status(400).json({ success: false, message: "User not found" });
		}

		res.status(200).json({ 
			success: true, 
			user: {
				...user._doc,
				userId: user._id
			}
		});
	} catch (error) {
		console.log("Error in checkAuth ", error);
		res.status(400).json({ success: false, message: error.message });
	}
}

export const updateCustomerInfo = async (req, res) => {
    try {
        const userId = req.userId;
        const { name, phoneNumber, profilePicture } = req.body;

        if (!name || !phoneNumber) {
            throw new Error("All fields are required");
        }

		const updateData = {
            name,
            phoneNumber,
        };

        // Add profile picture if provided
        if (profilePicture) {
            updateData.profilePicture = profilePicture;
        }

        const user = await User.findByIdAndUpdate(userId, updateData, { new: true });

        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: {
                ...user._doc,
                password: undefined,
            },
        });
    } catch (error) {
        console.log("Error in updateProfile ", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

export const deleteAccount = async (req, res) => {
    try {
		console.log("userid",req.userId);
        const userId = req.userId;
        if (!userId) {
            return res.status(400).json({ success: false, message: "User ID missing from request" });
        }
        // Find and delete the user
        const deletedUser = await User.findByIdAndDelete(userId);
        
        if (!deletedUser) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found" 
            });
        }
        
        // Clear authentication cookie
        res.clearCookie("token");
        
        res.status(200).json({ 
            success: true, 
            message: "Account successfully deleted" 
        });
    } catch (error) {
        console.log("Error in deleteAccount: ", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to delete account",
            error: error.message 
        });
    }
};
