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
  price:{
    type: Number,
    required: true
  }
},{ timestamps: true }
);

module.exports = mongoose.model('Ingredient', IngredientSchema);