const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middleware/authenticateJWT');
const TransactionIngredient = require('../models/TransactionIngredient');

// Route để lấy tất cả các giao dịch nguyên liệu
router.get('/', authenticateJWT, async (req, res) => {
    try {
        const transactions = await TransactionIngredient.find().populate('drink').populate('ingredient').sort({ createdAt: 'desc' });
        // Tính tổng giá trị của tất cả các giao dịch
        const totalPrices = transactions.reduce((total, transaction) => {
            return total + transaction.price;
        }, 0);
        res.json({ transactions, totalPrices });
    } catch (error) {
        console.error('Lỗi khi lấy thông tin giao dịch:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra, vui lòng thử lại sau' });
    }
});

// Route để lấy thông tin về một giao dịch cụ thể theo ID
router.get('/:id', authenticateJWT, async (req, res) => {
    const transactionId = req.params.id;
    try {
        const transaction = await TransactionIngredient.findById(transactionId);
        if (!transaction) {
            return res.status(404).json({ message: 'Không tìm thấy giao dịch' });
        }
        res.json(transaction);
    } catch (error) {
        console.error('Lỗi khi lấy thông tin giao dịch:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra, vui lòng thử lại sau' });
    }
});

module.exports = router;
