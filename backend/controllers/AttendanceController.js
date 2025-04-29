import Attendance from "../modeles/Attendancemodel.js";

// Get All Attendance Records
export const getAllAttendance = async (req, res, next) => {
    let records;
    try {
        records = await Attendance.find();
    } catch (err) {
        console.log(err);
    }

    if (!records) {
        return res.status(404).json({ message: "Attendance records not found" });
    }

    return res.status(200).json({ records });
};

export const addAttendance = async (req, res, next) => {
    const { name, department, status, reason } = req.body;
    let records;

    try {
        records = new Attendance({ name, department, status, reason });
        await records.save();
    } catch (err) {
        console.log(err);
    }

    if (!records) {
        return res.status(400).json({ message: "Unable to add attendance record" });
    }

    return res.status(201).json({ records });
};

export const getAttendanceById = async (req, res, next) => {
    const id = req.params.userId;
    let records;

    try {
        records = await Attendance.findById(id);
    } catch (err) {
        console.log(err);
    }

    if (!records) {
        return res.status(404).json({ message: "Attendance record not found" });
    }

    return res.status(200).json({ records });
};

export const updateAttendance = async (req, res, next) => {
    const id = req.params.userId;
    const { name, department, status, reason } = req.body;
    let records;

    try {
        records = await Attendance.findByIdAndUpdate(id, { name, department, status, reason }, { new: true });
    } catch (err) {
        console.log(err);
    }

    if (!records) {
        return res.status(404).json({ message: "Unable to update attendance record" });
    }

    return res.status(200).json({ records });
};

export const deleteAttendance = async (req, res, next) => {
    const id = req.params.userId;
    let records;

    try {
        records = await Attendance.findByIdAndDelete(id);
    } catch (err) {
        console.log(err);
    }

    if (!records) {
        return res.status(404).json({ message: "Unable to delete attendance record" });
    }

    return res.status(200).json({ message: "Attendance record deleted successfully" });
};
