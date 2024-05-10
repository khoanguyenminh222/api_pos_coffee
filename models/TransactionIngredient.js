const mongoose = require('mongoose');

const TransactionIngredientSchema = new mongoose.Schema({
  drink:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Drink',
    required: true
  },
  ingredient:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ingredient',
    required: true
  },
  quantity_transaction: {
    type: Number,
    required: true
  },
  quantity_prevTransaction: {
    type: Number,
    required: true
  },
  priceOfUnit:{
    type: Number,
    required: true
  },
  price:{
    type: Number,
    required: true
  }
},{ timestamps: true }
);

module.exports = mongoose.model('TransactionIngredient', TransactionIngredientSchema);