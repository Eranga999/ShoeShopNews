import jwt from "jsonwebtoken";
import DeliveryManager from "../modeles/deliveryManager.js";
import DeliveryPerson from "../modeles/deliveryPerson.js";

export const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Add user info to request
            req.user = decoded;

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

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

export const deliveryPersonAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: "No token, authorization denied" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.role !== 'delivery_person') {
            return res.status(403).json({ message: "Access denied" });
        }

        const deliveryPerson = await DeliveryPerson.findById(decoded.id);
        if (!deliveryPerson) {
            return res.status(401).json({ message: "Delivery person not found" });
        }

        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: "Token is not valid" });
    }
}; 