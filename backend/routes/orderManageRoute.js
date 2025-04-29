import express from "express";

import { addOrders, displayOrders, getAllOrders } from "../controllers/orderManagementController.js";

const OrderRoute = express.Router();

OrderRoute.post("/",addOrders)
OrderRoute.get("/all",getAllOrders)
OrderRoute.get("/:userId",displayOrders)



export default OrderRoute