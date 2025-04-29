import Employee from "../modeles/employeeModel.js";
import { User } from "../modeles/user.model.js";
import brcypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config()

export function loginUser(req, res){

    const data = req.body

    Employee.findOne({
        email: data.email
    }).then(
        (user)=>{
            
            if(user==null){
                res.status(404).json({error: "User not found"})
            }else{

                const isPasswordCorrect = brcypt.compareSync(data.password, user.password)

                if(isPasswordCorrect){
                    const token = jwt.sign({
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        role: user.role,
                        profilePic: user.profilePic
                    }, process.env.JWT_SECRET)
                    res.json({message: "Login success", token:token, user: user})
                }else{
                    res.status(401).json({error: "Login failed"})
                }
            }
        }
    )

}

export const getAllUsers = async (req, res) => {
    try {
      const users = await User.find().select('-password');
      res.status(200).json({
        success: true,
        count: users.length,
        data: users
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({
        success: false,
        error: "Server Error"
      });
    }
  };


  export const deleteUser = async (req, res) => {
    try {
      const userId = req.params.id;
      
      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found"
        });
      }
      
      // Delete the user
      await User.findByIdAndDelete(userId);
      
      res.status(200).json({
        success: true,
        message: "User deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({
        success: false,
        error: "Server Error"
      });
    }
  };

  export const getAllEmployees = async (req, res, next) => {
    let employees;
    try {
        employees = await Employee.find();
    } catch (err) {
        console.log(err);
    }

    if (!employees) {
        return res.status(404).json({ message: "No employees found" });
    }

    return res.status(200).json({ employees });
};

// Add a new employee
export const addEmployee = async (req, res, next) => {
    const { name, email, password, role, age } = req.body;
    let employee;

    try {
        employee = new Employee({ name, email, password, role, age });
        await employee.save();
    } catch (err) {
        console.log(err);
    }

    if (!employee) {
        return res.status(400).json({ message: "Unable to add employee" });
    }

    return res.status(201).json({ employee });
};

// Get an employee by ID
export const getEmployeeById = async (req, res, next) => {
    const id = req.params.id;
    let employee;

    try {
        employee = await Employee.findById(id);
    } catch (err) {
        console.log(err);
    }

    if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
    }

    return res.status(200).json({ employee });
};

// Update an employee
export const updateEmployee = async (req, res, next) => {
    const id = req.params.id;
    const { name, email, password, role, age } = req.body;
    let employee;

    try {
        employee = await Employee.findByIdAndUpdate(id, { name, email, password, role, age }, { new: true });
    } catch (err) {
        console.log(err);
    }

    if (!employee) {
        return res.status(404).json({ message: "Unable to update employee" });
    }

    return res.status(200).json({ employee });
};

// Delete an employee
export const deleteEmployee = async (req, res, next) => {
    const id = req.params.id;
    let employee;

    try {
        employee = await Employee.findByIdAndDelete(id);
    } catch (err) {
        console.log(err);
    }

    if (!employee) {
        return res.status(404).json({ message: "Unable to delete employee" });
    }

    return res.status(200).json({ message: "Employee deleted successfully" });
};