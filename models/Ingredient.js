const mongoose = require('mongoose');

const IngredientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  priceOfUnit:{
    type: Number,
    required: true
  },
  totalPrice:{
    type: Number,
    required: true
  }
},{ timestamps: true }
);

module.exports = mongoose.model('Ingredient', IngredientSchema);