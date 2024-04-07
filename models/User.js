const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true // Đảm bảo không có hai tài khoản có cùng tên đăng nhập
    },
    password: {
        type: String,
        required: true
    },
    fullname: {
        type: String,
        required: true,
    },
    dateOfBirth: { type: Date},
    gender: { type: String, enum: ['Male', 'Female', 'Other']},
    address: { type: String},
    phoneNumber: { type: String},
    email: { type: String},
    shift: { type: String },
    role: {
        type: String,
        enum: ['admin', 'manager', 'user'], // Phân quyền cho người dùng
        default: 'user' // Mặc định là 'user' nếu không được chỉ định
    }
},
{ timestamps: true });
module.exports = mongoose.model('User', UserSchema);