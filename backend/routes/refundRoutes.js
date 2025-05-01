import express from 'express';
import multer from 'multer';
import path from 'path';
import { createRefundRequest, getUserRefundRequests, getRefundRequest, updateRefundStatus } from '../controllers/refundController.js';
import { verifyToken } from '../middleware/verifyToken.js';

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

// Routes
router.post('/order/:orderId/refund-request', verifyToken, upload.array('images', 3), createRefundRequest);
router.get('/user/:userId/refunds', verifyToken, getUserRefundRequests);
router.get('/refund/:refundId', verifyToken, getRefundRequest);
router.put('/refund/:refundId/status', verifyToken, updateRefundStatus);

export default router; 