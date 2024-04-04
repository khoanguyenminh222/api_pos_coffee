const mongoose = require('mongoose');

const DrinkSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  prices: {
    M: {
      type: Number,
      required: true
    },
    L: {
      type: Number,
      required: true
    }
  },
  image: {
    type: String,
    required: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  options: {
    temperature: {
      type: [String],
      enum: ['hot', 'cold']
    },
    sugar: {
      type: [String],
      enum: ['30%', '50%', '70%']
    },
    ice: {
      type: [String],
      enum: ['30%', '50%', '70%']
    }
  }
},
{ timestamps: true }
);

module.exports = mongoose.model('Drink', DrinkSchema);
