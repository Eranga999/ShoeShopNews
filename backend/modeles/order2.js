import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId:{type: String, required: true},
    firstName:{type: String,required: true},
    lastName:{type: String,required: true},
    totalAmount:{ type:Number,required :true},
    orderDate:{type:Date,default:Date.now},
    paymentMethod:{type:String,required:true},
    paymentStatus:{type:String,required:true,enum: ["Unpaid", "Paid"]},
    shippingAddress:{type:String,required:true},
    phonenumber:{type:Number,required:true},
    email:{type:String,required:true},
    city:{type:String,required:true},
    deliveryStatus: {
        type: String,
        enum: ["processing", "pickedup", "delivered"],
        default: "processing",
    },
    deliveryPerson: {
        _id: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryPerson' },
        name: String,
        email: String,
        phone: String
    },
    items: [
        {
          shoeId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
          },
          BrandName:{
            type:String
          },
          ModelName:{
            type:String
          },
          color: { type: String, required: true },
          size: { type: Number, required: true },
          quantity: { type: Number, required: true,},
          imageUrl: { type: String, required: true },
        },
    ],
});

const Orders = mongoose.model("Order",orderSchema);
export default Orders;