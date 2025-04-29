import express from "express";
import { loginUser, getAllUsers, deleteUser } from "../controllers/employeeController.js";

const userRouter = express.Router()

userRouter.post("/login", loginUser)
userRouter.get("/", getAllUsers);
userRouter.delete("/:id", deleteUser);

export default userRouter