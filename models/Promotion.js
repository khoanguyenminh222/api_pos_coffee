const mongoose = require('mongoose');

const PromotionSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['buy_get_free', 'discount', 'fixed_price', 'buy_category_get_free'], // Loại chương trình khuyến mãi
    required: true
  },
  conditions: {
    buy_get_free: {
      buyItems: [{
        drink: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Drink', // Tham chiếu đến collection của đồ uống
          required: true
        },
        quantity: {
          type: Number,
          required: true
        }
      }],
      freeItems: [{
        drink: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Drink', // Tham chiếu đến collection của đồ uống
          required: true
        },
        quantity: {
          type: Number,
          required: true
        }
      }]
    },
    discount: {
      totalAmount: {
        type: Number
      },
      discountPercent: {
        type: Number // Phần trăm giảm giá
      }
    },
    fixed_price: {
      fixedPriceItems: [{
        category: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Category', // Tham chiếu đến collection của đồ uống
          required: true
        },
        fixedPrice: {
          type: Number,
          required: true
        }
      }]
    },
    buy_category_get_free: {
      buyCategoryItems: [{
        category: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Category', // Tham chiếu đến collection của đồ uống
          required: true
        },
        quantity: {
          type: Number,
          required: true
        }
      }],
      freeCategoryItems: [{
        drink: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Drink', // Tham chiếu đến collection của đồ uống
          required: true
        },
        quantity: {
          type: Number,
          required: true
        }
      }]
    }
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

module.exports = mongoose.model('Promotion', PromotionSchema);
