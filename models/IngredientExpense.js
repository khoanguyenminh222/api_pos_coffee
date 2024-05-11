const mongoose = require('mongoose');

const IngredientExpenseSchema = new mongoose.Schema({
  ingredient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ingredient',
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  unit:{
    type: String,
    required: true
  },
  unitPrice: {
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
},{ timestamps: true }
);

module.exports = mongoose.model('IngredientExpense', IngredientExpenseSchema);
