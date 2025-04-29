import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    department: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ["Present", "Absent", "Sick"],
        required: true,
    },
    reason: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    }
});

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;
