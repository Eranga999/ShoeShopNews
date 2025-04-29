import Cart from "../modeles/cart.js";
import Orders from "../modeles/order.js";
import Shoes from "../modeles/shoe.js"

export async function addOrders(req, res) {
  const data = req.body;
  console.log(data);
  const newOrders = new Orders(data);


  try {
    // Save the order first
    await newOrders.save();

    // Loop through the ordered items
    for (const item of data.items) {
      const { shoeId, color, size, quantity } = item;

      // Find the shoe
      const shoe = await Shoes.findById(shoeId);
      if (!shoe) continue;

      // Find the matching variant and size
      const variant = shoe.variants.find(v => v.color === color);
      if (!variant) continue;

      const sizeObj = variant.sizes.find(s => s.size === size);
      if (!sizeObj) continue;

      // Update stock and salesCount
      sizeObj.stock = Math.max(0, sizeObj.stock - quantity);
      shoe.salesCount = (shoe.salesCount || 0) + quantity;

      // Save the updated shoe
      await shoe.save();
    }

    // Delete the user's cart
    await Cart.findOneAndDelete({ userId: data.userId });

    res.json({
      message: "Order saved successfully, stock updated, and cart deleted",
    });
  } catch (error) {
    res.status(500).json({
      error: "Order addition failed",
      details: error,
    });
  }
}




export async function displayOrders(req,res) {

    try {
        const { userId } = req.params; 

        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        const order = await Orders.find({ userId });

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.json(order);
    } catch (error) {
        
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export async function getAllOrders(req, res) {
  try {
      const orders = await Orders.find();

      if (!orders || orders.length === 0) {
          return res.status(404).json({ message: "No orders found" });
      }

      res.status(200).json(orders);
  } catch (error) {
      console.error("Error fetching all orders:", error);
      res.status(500).json({ message: "Internal Server Error" });
  }
}


