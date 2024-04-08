const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const User = require('../models/User');

// Hàm để tạo username mặc định từ fullname và phoneNumber
function generateUsername(fullname, phoneNumber) {
    // Xóa bỏ dấu cách trong fullname và chuyển thành chữ thường
    const cleanedFullname = fullname.replace(/\s+/g, '').toLowerCase();
    // Loại bỏ các ký tự không phải chữ hoặc số trong phoneNumber
    const cleanedPhoneNumber = phoneNumber.replace(/\D/g, '');
    // Kết hợp fullname và phoneNumber để tạo username mặc định
    return `${cleanedFullname}${cleanedPhoneNumber}`;
}
// Route để tạo người dùng mới
router.post('/register', async (req, res) => {
    try {
        // Nhận thông tin từ yêu cầu
        const { username, password, fullname, role, dateOfBirth, gender, address, phoneNumber, email } = req.body;

        // Kiểm tra xem người dùng đã tồn tại trong cơ sở dữ liệu chưa
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Người dùng đã tồn tại' });
        }

        // Thiết lập giá trị mặc định cho username nếu không được cung cấp
        if (!username || username==='') {
            username = generateUsername(fullname, phoneNumber);
        }
        if(!password || password===''){
            password = '1';
        }

        // Khởi tạo một người dùng mới với các thông tin được truyền vào
        const newUser = new User({ 
            username, 
            password: password ? await bcrypt.hash(password, 10) : undefined, // Mã hóa mật khẩu nếu được cung cấp
            fullname, 
            role,
            dateOfBirth,
            gender,
            address,
            phoneNumber,
            email
        });
        console.log(newUser)
        // Lưu người dùng mới vào cơ sở dữ liệu
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
        res.status(201).json({ message: 'Đăng nhập thành công' });
    } catch (error) {
        console.error('Lỗi khi đăng nhập:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra, vui lòng thử lại sau' });
    }
});

router.get('/:username', async (req, res) => {
    try {
        const username = req.params.username;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error('Lỗi khi lấy người dùng:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra, vui lòng thử lại sau' });
    }
});

router.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        console.error('Lỗi khi lấy tất cả người dùng:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra, vui lòng thử lại sau' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const updatedUserData = req.body;
        const updatedUser = await User.findByIdAndUpdate(userId, updatedUserData, { new: true });
        if (!updatedUser) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }
        res.status(201).json(updatedUser);
    } catch (error) {
        console.error('Lỗi khi cập nhật người dùng:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra, vui lòng thử lại sau' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const deletedUser = await User.findByIdAndDelete(userId);
        if (!deletedUser) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }
        res.status(201).json({ message: 'Người dùng đã được xóa thành công' });
    } catch (error) {
        console.error('Lỗi khi xóa người dùng:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra, vui lòng thử lại sau' });
    }
});

module.exports = router;