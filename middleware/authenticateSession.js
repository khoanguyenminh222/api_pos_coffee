
function authenticateSession(req, res, next) {
    if (req.session && req.session.user) {
        // Session tồn tại, tiếp tục xử lý các routes
        next();
    } else {
        // Session không tồn tại, chuyển hướng hoặc trả về lỗi
        res.status(401).send('Unauthorized');
    }
}

module.exports = authenticateSession;