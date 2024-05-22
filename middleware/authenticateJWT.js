const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function authenticateJWT(req, res, next) {
    const authorization = req.headers['authorization'];
    const token = authorization.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Yêu cầu token' });
    }

    try {
        const decoded = jwt.verify(token, process.env.KEY_SECRET);
        const userId = decoded.userId;
        const user = await User.findById(userId); // Tìm người dùng từ userId

        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }

        req.user = user; // Gắn vai trò của người dùng vào req.user
        req.userId = userId
        next();
    } catch (error) {
        console.error(error);
        return res.status(401).json({ message: 'Yêu cầu token không hợp lệ' });
    }
}

module.exports = authenticateJWT;