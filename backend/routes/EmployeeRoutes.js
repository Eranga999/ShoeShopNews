// employeeRoutes.js
import express from "express";
import {
    addEmployee,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
    getAllEmployees
} from "../controllers/EmployeeController.js";

const EmployeeRoutes = express.Router();

EmployeeRoutes.post("/", addEmployee);
EmployeeRoutes.get("/", getAllEmployees);
EmployeeRoutes.get("/:id", getEmployeeById);
EmployeeRoutes.put("/:id", updateEmployee);
EmployeeRoutes.delete("/:id", deleteEmployee);

export default EmployeeRoutes;
