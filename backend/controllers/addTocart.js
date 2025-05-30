
import Cart from "../modeles/cart.js";
import Shoes from "../modeles/shoe.js";
import mongoose from "mongoose";

export const addTocart = async (req, res) => {
  // Renamed addTocart to addToCart
  try {
    const { userId, items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ message: "Shoes are required and cannot be empty" });
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, items });
    } else {
      let itemAlreadyExists = false;

      items.forEach((newItem) => {
        const newBrandId = new mongoose.Types.ObjectId(newItem.brand.brandId);
        const newColorId = new mongoose.Types.ObjectId(newItem.color.colorId);
        const newSizeId = new mongoose.Types.ObjectId(newItem.size.sizeId);

        const existingItem = cart.items.find(
          (item) =>
            item.brand.brandId.equals(newBrandId) &&
            item.color.colorId.equals(newColorId) &&
            item.size.sizeId.equals(newSizeId)
        );

        if (existingItem) {
          itemAlreadyExists = true;
        } else {
          cart.items.push(newItem);
        }
      });

      if (itemAlreadyExists) {
        return res.status(400).json({ message: "Item is already in the cart" });
      }
    }

    await cart.save();
    res
      .status(200)
      .json({ message: "Item is added to cart successfully", cart });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const displaycart = async (req, res) => {
  // Renamed displaycart to displayCart
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    res.json(cart);
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateCartQuantity = async (req, res) => {
  try {
    const { userId } = req.params;
    const { item } = req.body;

    
    // Convert shoeId to ObjectId
    const brandObjId = new mongoose.Types.ObjectId(item.brand.brandId);
    const colorObjId = new mongoose.Types.ObjectId(item.color.colorId);
    const sizeObjId = new mongoose.Types.ObjectId(item.size.sizeId);

    // Find the shoe
    const shoe = await Shoes.findById(brandObjId);
    if (!shoe) {
      return res.status(404).json({ message: "Shoe not found" });
    }

    let selectedVariant = shoe.variants.find((v) => v._id.equals(colorObjId));
    if (!selectedVariant) {
      return res.status(404).json({ message: "Color not available" });
    }

    let selectedSize = selectedVariant.sizes.find((s) =>
      s._id.equals(sizeObjId)
    );
    if (!selectedSize) {
      return res.status(404).json({ message: "Size not available" });
    }

    if (item.quantity > selectedSize.stock) {
      return res
        .status(400)
        .json({ message: `Only ${selectedSize.stock} items left in stock` });
    }

    // Check if cart exists
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const updatedCart = await Cart.findOneAndUpdate(
      {
        userId: userId,
        "items.brand.brandId": brandObjId,
        "items.color.colorId": colorObjId,
        "items.size.sizeId": sizeObjId,
      },
      { $set: { "items.$.quantity": item.quantity } },
      { new: true }
    );

    if (!updatedCart) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    res.status(200).json({ message: "Cart updated successfully", updatedCart });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};

export async function deleteCartItem(req, res) {
  try {
    const {userId} = req.params;
    const { brandId, colorId, sizeId } = req.body;

    // Convert shoeId to ObjectId
    const brandObjId = new mongoose.Types.ObjectId(brandId);
    const colorobjId = new mongoose.Types.ObjectId(colorId);
    const shoeSizeobjId = new mongoose.Types.ObjectId(sizeId);

    const cart = await Cart.findOneAndUpdate(
      { userId },
      {
        $pull: {
          items: {
            "brand.brandId": brandObjId,
            "color.colorId": colorobjId,
            "size.sizeId": shoeSizeobjId,
          },
        },
      },
      { new: true }
    );

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    res.json({ message: "Item removed from cart successfully" , cart});
  } catch (error) {
    res.status(500).json({ message: "Failed to delete cart item", error });
  }
}
