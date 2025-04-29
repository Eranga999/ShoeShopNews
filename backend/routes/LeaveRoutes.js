import express from "express";
import {getAllLeave,addLeave,getLeaveById,updateLeave,deleteLeave} from "../controllers/LeaveController.js";

const LeaveRoutes = express.Router();

LeaveRoutes.get("/", getAllLeave);
LeaveRoutes.post("/", addLeave);
LeaveRoutes.get("/:id", getLeaveById);
LeaveRoutes.put("/:id", updateLeave);
LeaveRoutes.delete("/:id", deleteLeave);

export default LeaveRoutes;
