import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    leaveType: {
        type: String,
        required: true,
    },
    department: {
        type: String,
        required: true,
    },
    position: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    }
});

const Leave = mongoose.model("Leave", leaveSchema);

export default Leave;
