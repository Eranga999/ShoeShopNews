import express from "express";
import bodyParser from "body-parser";
import mongoose, { connect } from "mongoose";
// import productRouter from "../backend/routes/productRouter.js"
import cartRoute from "./routes/cartRoute.js";
// import wishlistRoute from "./routes/wishlistRoute.js";
import reviewRoute from "./routes/reviewRoute.js";
// import customizeShoeRoute from "./routes/customizeshoueRoute.js";
// import userRouter from "./routes/userRouter.js"
import OrderRoute from "./routes/orderManagerRoute2.js";
import dotenv from "dotenv"
import cors from "cors"
import cookieParser from "cookie-parser";
import { connectDB } from "./DB/connectDB.js";
import router from "./routes/authRouter.js";
import productRouter from "./routes/productRouter.js";
import orderRoute from "./routes/orderManageRoute.js"
import md5 from "md5";
import userRouter from "./routes/employeeRoute.js";
import AttendanceRoutes from "./routes/AttendanceRoutes.js";
import LeaveRoutes from "./routes/LeaveRoutes.js";
import EmployeeRoutes from "./routes/EmployeeRoutes.js";

// import router from "./routes/authRouter.js";

dotenv.config();

let app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "http://localhost:5173", credentials: true}));
app.use(express.json())
app.use(cookieParser())

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

 app.use("/api/auth/", router)
// app.use("/api/users", userRouter)
 app.use("/api/product", productRouter);
 app.use("/api/cart", cartRoute);
// app.use("/api/wishlist", wishlistRoute);
app.use("/api/review", reviewRoute);
app.use("/api/order", orderRoute);
// app.use("/api/customize", customizeShoeRoute);
app.use("/api/users", userRouter);
// app.use("/payment", paymentRoutes);

app.use("/api/attendance", AttendanceRoutes);

app.use("/api/leaves", LeaveRoutes);
app.use("/api/employees",EmployeeRoutes);


app.use("/api/orders", OrderRoute);

app.listen(PORT,()=>{
    connectDB()
    console.log("Server starting on port", PORT)
})
