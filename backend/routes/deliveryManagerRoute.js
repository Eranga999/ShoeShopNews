import express from "express";
import { 
    registerDeliveryManager, 
    loginDeliveryManager, 
    getAssignedOrders, 
    updateDeliveryStatus,
    getProfile 
} from "../controllers/deliveryManagerController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/register", registerDeliveryManager);
router.post("/login", loginDeliveryManager);

// Protected routes
router.get("/profile", authMiddleware, getProfile);
router.get("/orders", authMiddleware, getAssignedOrders);
router.put("/orders/:orderId/status", authMiddleware, updateDeliveryStatus);

export default router; 