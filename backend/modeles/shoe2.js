import mongoose from "mongoose";

const shoeSchema = new mongoose.Schema(
  {
    brand: { type: String, required: true },
    model: { type: String, required: true },
    shoeWearer: {
      type: String,
      enum: ["Men", "Women", "Kids"],
      required: true,
    },
    shoeType: { type: String, required: true },
    price: { type: Number, required: true },
    variants: [
      {
        color: { type: String, required: true },
        sizes: [
          {
            size: { type: Number, required: true },
            stock: { type: Number, required: true, min: 0 },
          },
        ],
        imageUrl: { type: String, required: true },
      },
    ],
    salesCount: { type: Number, default: 0 },
    description: { type: String },
    availability: { type: Boolean, required: true, default: true },
  },
  { timestamps: true }
);

const Shoes = mongoose.model("Shoes", shoeSchema);
export default Shoes;