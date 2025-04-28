const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({
  userId: { type: Number, required: true },  // MySQL'deki user_id ile eşleşecek
  items: [
    {
      productId: { type: String, required: true },  // Ürün ID'si
      quantity: { type: Number, default: 1 }        // Ürün adedi
    }
  ]
});

module.exports = mongoose.model('Cart', CartSchema);
