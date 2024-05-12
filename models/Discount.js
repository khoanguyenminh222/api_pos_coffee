const mongoose = require('mongoose');

const DiscountSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true // Tên của chương trình giảm giá là duy nhất
  },
  description: {
    type: String,
    required: true
  },
  discountAmount: {
    type: Number, // giảm giá phần trăm
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
},
{ timestamps: true }
);

module.exports = mongoose.model('Discount', DiscountSchema);
