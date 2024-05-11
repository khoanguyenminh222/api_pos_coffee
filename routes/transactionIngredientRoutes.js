const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middleware/authenticateJWT');
const TransactionIngredient = require('../models/TransactionIngredient');
const Ingredient = require('../models/Ingredient')

function getStartEndDate(date, period) {
    let startDate, endDate;
    switch (period) {
        case 'day':
            startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
            endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
            break;
        case 'week':
            startDate = new Date(date);
            startDate.setDate(startDate.getDate() - startDate.getDay()); // Move to the beginning of the week (Sunday)
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 6); // Move to the end of the week (Saturday)
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'month':
            startDate = new Date(date.getFullYear(), date.getMonth(), 1);
            endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            break;
        case 'year':
            startDate = new Date(date.getFullYear(), 0, 1);
            endDate = new Date(date.getFullYear(), 11, 31);
            break;
        default:
            // Default to current day
            startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
            endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
            break;
    }
    return { startDate, endDate };
}
// Route để lấy tất cả các giao dịch nguyên liệu
router.get('/:period', authenticateJWT, async (req, res) => {
    try {
        console.log(req.query)
        let { period } = req.params;
        let { page, pageSize, search } = req.query;
        const date = req.query.date ? new Date(req.query.date) : new Date();
        let query = {};

        if (period !== 'all') {
            const { startDate, endDate } = getStartEndDate(date, period);
            query.createdAt = { $gte: startDate, $lte: endDate };
        }

        if (search) {
            const ingredients = await Ingredient.find({
                name: { $regex: new RegExp(search, 'i') }
            });
            const ingredientIds = ingredients.map(ingredient => ingredient._id);
            query.ingredient = { $in: ingredientIds };
        }
        
        const totalCount = await TransactionIngredient.countDocuments(query);

        // Phân trang
        const currentPage = parseInt(page) || 1;
        const limit = parseInt(pageSize) || 10; // Số lượng giao dịch trên mỗi trang, mặc định là 10
        const skip = (currentPage - 1) * limit;

        const transactions = await TransactionIngredient.find(query)
            .populate('drink')
            .populate('ingredient')
            .sort({ createdAt: 'desc' })
            .limit(limit)
            .skip(skip);

         // Tính tổng giá trị của tất cả các giao dịch
         const totalPrices = await TransactionIngredient.aggregate([
            { $match: query },
            { $group: { _id: null, totalPrice: { $sum: "$price" } } }
        ]);

        const totalPrice = totalPrices.length > 0 ? totalPrices[0].totalPrice : 0;

        res.json({
            transactions,
            totalPrices: totalPrice,
            currentPage,
            totalPages: Math.ceil(totalCount / limit),
        });
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
