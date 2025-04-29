import express from "express";

import { addOrders, displayOrders, getAllOrders, updateOrderStatus } from "../controllers/orderManagerController2.js";

const OrderRoute = express.Router();

OrderRoute.post("/", addOrders);
OrderRoute.get("/all", getAllOrders);
OrderRoute.get("/:userId", displayOrders);
OrderRoute.put("/:id", updateOrderStatus);
OrderRoute.get("/", getAllOrders);

export default OrderRoute;