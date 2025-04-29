import Order from "../Models/orderModel.js";
import productModel from "../Models/productModel.js";
export const getOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate("products.product", "name price description");
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
export const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });
        order.status = status;
        await order.save();
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

export const addProduct = async (req, res) => {
    try {
        const { name, description, price, stock } = req.body;

        // Validate required fields
        if (!name || !price || !stock) {
            return res.status(400).json({
                message: "Missing required fields: name, price, and stock"
            });
        }

        // Create new product
        const newProduct = await productModel.create({
            name,
            description: description || "",
            price,
            stock
        });

        res.status(201).json(newProduct);

    } catch (error) {
        res.status(500).json({
            message: "Failed to create product",
            error: error.message
        });
    }
};

export const addOrder = async (req, res) => {
    try {
        const { customerName, products } = req.body;
        
        // Validate required fields
        if (!customerName || !products) {
            return res.status(400).json({
                message: "Missing required fields: customerName and products"
            });
        }

        // Create new order
        const newOrder = await Order.create({ 
            customerName, 
            products: products.map(p => ({
                product: p.productId,
                quantity: p.quantity
            }))
        });
        res.status(201).json(newOrder);
        
    } catch (error) {
        res.status(500).json({ 
            message: "Failed to create order", 
            error: error.message 
        });
    }
};