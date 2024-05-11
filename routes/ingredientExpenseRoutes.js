const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middleware/authenticateJWT');
const IngredientExpense = require('../models/IngredientExpense');
const Ingredient = require('../models/Ingredient');

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
// Lấy tất cả các giao dịch chi tiêu nguyên liệu
router.get('/:period?', authenticateJWT, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Default page is 1 if page parameter is not provided
        const pageSize = parseInt(req.query.pageSize) || 10; // Default page size is 10 if pageSize parameter is not provided
        const period = req.params.period || 'day'; // Default period is 'day' if period parameter is not provided
        const date = req.query.date ? new Date(req.query.date) : new Date(); // Default to current date if date parameter is not provided

        const { startDate, endDate } = getStartEndDate(date, period);

        const query = {
            createdAt: { $gte: startDate, $lte: endDate }
        };
        let search = req.query;
        if (search) {
            const ingredients = await Ingredient.find({
                name: { $regex: new RegExp(search, 'i') }
            });
            const ingredientIds = ingredients.map(ingredient => ingredient._id);
            query.ingredient = { $in: ingredientIds };
        }

        const totalCount = await IngredientExpense.countDocuments(query);

        // Get total amount of expenses
        const totalAmountSum = await IngredientExpense.aggregate([
            { $match: query },
            { $group: { _id: null, totalAmount: { $sum: "$totalAmount" } } }
        ]);

        // Get ingredient expenses with pagination
        const expenses = await IngredientExpense.find(query)
            .populate('ingredient') // Populate 'ingredient' field with actual ingredient data
            .limit(pageSize * 1)
            .skip((page - 1) * pageSize)
            .sort({ createdAt: 'desc' });

        res.json({
            totalAmount: totalAmountSum.length ? totalAmountSum[0].totalAmount : 0,
            totalPages: Math.ceil(totalCount / pageSize),
            currentPage: page,
            expenses,
        });
    } catch (error) {
        console.error('Error fetching ingredient expenses:', error);
        res.status(500).json({ message: 'An error occurred, please try again later' });
    }
});

// Tạo mới một giao dịch chi tiêu nguyên liệu
router.post('/', authenticateJWT, async (req, res) => {
    try {
        // Lấy danh sách mục chi phí nguyên liệu từ body của yêu cầu
        const expenseItems = req.body;

        // Kiểm tra xem expenseItems có tồn tại hay không
        if (!expenseItems || !Array.isArray(expenseItems)) {
            return res.status(400).json({ message: 'Invalid request body' });
        }

        // Tạo mới các mục chi phí nguyên liệu trong cơ sở dữ liệu
        const createdItems = await IngredientExpense.insertMany(expenseItems);

        // Trả về danh sách các mục chi phí nguyên liệu đã tạo mới
        res.status(201).json(createdItems);
    } catch (error) {
        console.error('Error creating ingredient expenses:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Cập nhật thông tin của một giao dịch chi tiêu nguyên liệu
router.put('/:id', authenticateJWT, async (req, res) => {
    const { id } = req.params;
    const { ingredient, quantity, unit, unitPrice, totalAmount } = req.body;
    try {
        const updatedExpense = await IngredientExpense.findByIdAndUpdate(id, { ingredient, quantity, unit, unitPrice, totalAmount }, { new: true });
        res.json(updatedExpense);
    } catch (error) {
        console.error('Lỗi khi cập nhật giao dịch chi tiêu nguyên liệu:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra, vui lòng thử lại sau' });
    }
});

// Xóa một giao dịch chi tiêu nguyên liệu
router.delete('/:id', authenticateJWT, async (req, res) => {
    const { id } = req.params;
    try {
        await IngredientExpense.findByIdAndDelete(id);
        res.json({ message: 'Xóa thành công' });
    } catch (error) {
        console.error('Lỗi khi xóa giao dịch chi tiêu nguyên liệu:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra, vui lòng thử lại sau' });
    }
});

// Lấy thông tin một giao dịch chi tiêu nguyên liệu dựa trên ID
router.get('/:id', authenticateJWT, async (req, res) => {
    const { id } = req.params;
    try {
        const expense = await IngredientExpense.findById(id);
        if (!expense) {
            return res.status(404).json({ message: 'Không tìm thấy giao dịch chi tiêu nguyên liệu' });
        }
        res.json(expense);
    } catch (error) {
        console.error('Lỗi khi lấy thông tin giao dịch chi tiêu nguyên liệu:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra, vui lòng thử lại sau' });
    }
});

module.exports = router;
