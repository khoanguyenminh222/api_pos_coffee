const mongoose = require('mongoose');

const DrinkSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category', // Tham chiếu tới mô hình Category
    required: true
  },
  options: {
    temperature: {
      type: String,
      enum: ['hot', 'cold']
    },
    size: {
      type: String,
      enum: ['S', 'M', 'L']
    },
    sugar: {
      type: String,
      enum: ['30%', '50%', '70%']
    },
    ice: {
      type: String,
      enum: ['30%', '50%', '70%']
    }
  }
});

module.exports = mongoose.model('Drink', DrinkSchema);
