const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true // Đảm bảo không có hai tài khoản có cùng tên đăng nhập
    },
    password: {
        type: String,
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
    role: {
        type: String,
        enum: ['admin', 'manager', 'user', 'test'], // Phân quyền cho người dùng
        default: 'test' // Mặc định là 'user' nếu không được chỉ định
    }
},
{ timestamps: true });
module.exports = mongoose.model('User', UserSchema);