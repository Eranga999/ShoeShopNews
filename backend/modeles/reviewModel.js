import mongoose from "mongoose";

const { Schema } = mongoose;


const reviewSchema=new Schema({
    name:{
        type:String,
        required:true,
    },
    comment:{
        type:String,
        required:true,
    },
    rate:{
        
        type:Number,
        required:true,
    
    },
});
 
    export default mongoose.model("reviewModel",reviewSchema);