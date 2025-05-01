import express from 'express';
import multer from 'multer';
import path from 'path';
import { 
    createRefundRequest, 
    getUserRefundRequests, 
    getRefundRequest, 
    updateRefundStatus,
    updateRefundRequest,
    deleteRefundRequest 
} from '../controllers/refundController.js';
import { verifyToken } from '../middleware/verifyToken.js';
import fs from 'fs';

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/refunds/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
});

// Ensure uploads directory exists
const uploadDir = 'uploads/refunds';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Routes
router.post('/order/:orderId/refund-request', verifyToken, upload.array('images', 3), createRefundRequest);
router.get('/user/:userId/refunds', verifyToken, getUserRefundRequests);
router.get('/:refundId', verifyToken, getRefundRequest);
router.put('/:refundId/status', verifyToken, updateRefundStatus);

// Add new routes for update and delete
router.put('/:refundId', verifyToken, upload.array('images', 3), updateRefundRequest);
router.delete('/:refundId', verifyToken, deleteRefundRequest);

export default router; 