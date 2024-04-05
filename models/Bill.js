const mongoose = require('mongoose');
const BillSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Tham chiếu đến schema của người dùng
        required: true
    },
    drinks: [{
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Drink', // Tham chiếu đến schema của các đồ uống
            required: true
        },
        name:{
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        options: {
            type: Object, // Thay đổi dựa trên yêu cầu cụ thể
            required: true
        },
        price: {
            type: Number,
            required: true
        }
    }],
    totalAmount: {
        type: Number,
        required: true
    }
},{ timestamps: true }
);
module.exports = mongoose.model('Bill', BillSchema);