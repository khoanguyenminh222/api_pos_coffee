const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const User = require('../models/User');

// Route để tạo người dùng mới
router.post('/register', async (req, res) => {
    try {
        const { username, password, fullname, role } = req.body;
        
        // Kiểm tra xem người dùng đã tồn tại trong cơ sở dữ liệu chưa
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Người dùng đã tồn tại' });
        }

        // Kiểm tra xem mật khẩu có tồn tại hay không
        if (!password) {
            return res.status(400).json({ message: 'Vui lòng nhập mật khẩu' });
        }

        // Mã hóa mật khẩu trước khi lưu vào cơ sở dữ liệu
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tạo người dùng mới
        const newUser = new User({ username, password: hashedPassword, fullname, role });
        await newUser.save();

        res.status(201).json({ message: 'Người dùng đã được tạo thành công' });
    } catch (error) {
        console.error('Lỗi khi tạo người dùng:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra, vui lòng thử lại sau' });
    }
});

// Route để đăng nhập
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Tìm người dùng trong cơ sở dữ liệu
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
        }

        // So sánh mật khẩu
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
        }

        // Đăng nhập thành công
        res.status(200).json({ message: 'Đăng nhập thành công' });
    } catch (error) {
        console.error('Lỗi khi đăng nhập:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra, vui lòng thử lại sau' });
    }
});

module.exports = router;