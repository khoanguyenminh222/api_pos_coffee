const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const token = req.headers['Authorization'];
    if (!token) return res.status(403).json({ auth: false, message: 'No token provided.' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

module.exports = verifyToken;
