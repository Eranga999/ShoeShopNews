import jwt from "jsonwebtoken";
import DeliveryManager from "../modeles/deliveryManager.js";

export const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: "No token, authorization denied" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.role !== 'delivery_manager') {
            return res.status(403).json({ message: "Access denied" });
        }

        const manager = await DeliveryManager.findById(decoded.id);
        if (!manager) {
            return res.status(401).json({ message: "Manager not found" });
        }

        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: "Token is not valid" });
    }
}; 