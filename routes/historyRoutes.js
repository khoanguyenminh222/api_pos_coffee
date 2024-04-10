const express = require('express');
const router = express.Router();
const Bill = require('../models/Bill');

function getWeek(date) {
    const startOfWeek = new Date(date);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date(date);
    endOfWeek.setHours(23, 59, 59, 999);
    endOfWeek.setDate(endOfWeek.getDate() - endOfWeek.getDay() + 6);
    return { start: startOfWeek, end: endOfWeek };
}

// Hàm lấy tháng của một ngày cụ thể
function getMonth(date) {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return { start: startOfMonth, end: endOfMonth };
}

// Hàm lấy năm của một ngày cụ thể
function getYear(date) {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const endOfYear = new Date(date.getFullYear(), 11, 31);
    return { start: startOfYear, end: endOfYear };
}
// GET transaction history with pagination and total amount
router.get('/:period/:userId?', async (req, res) => {
    try {
        let { page = 1, pageSize = 10 } = req.query;
        const period = req.params.period;
        const userId = req.params.userId; // userId có thể có hoặc không
        const dateFromBody = req.query.date ? new Date(req.query.date) : new Date();
        // Prepare query conditions based on period
        let dateQuery = {};
        let userQuery = {}; // Điều kiện tìm kiếm cho user_id

        // Kiểm tra nếu user_id được truyền trong yêu cầu
        if (userId) {
            userQuery = { userId };
        }
        switch (period) {
            case 'day':
                const startOfDay = new Date(dateFromBody.getFullYear(), dateFromBody.getMonth(), dateFromBody.getDate(), 0, 0, 0);
                const endOfDay = new Date(dateFromBody.getFullYear(), dateFromBody.getMonth(), dateFromBody.getDate(), 23, 59, 59);
                dateQuery = { $gte: startOfDay, $lte: endOfDay };
                break;
            case "week":
                const weekToQuery = getWeek(dateFromBody);
                dateQuery = { $gte: weekToQuery.start, $lte: weekToQuery.end };
                break;
            case "month":
                const monthToQuery = getMonth(dateFromBody);
                dateQuery = { $gte: monthToQuery.start, $lte: monthToQuery.end };
                break;
            case "year":
                const yearToQuery = getYear(dateFromBody);
                dateQuery = { $gte: yearToQuery.start, $lte: yearToQuery.end };
                break;
            case "all":
                // Trả về tất cả các mặt hàng đã bán mà không phụ thuộc vào ngày
                try {
                    // Get total amount of transactions
                    const totalAmount = await Bill.aggregate([
                        { $group: { _id: null, totalAmount: { $sum: "$totalAmount" } } }
                    ]);

                    // Get transaction history with pagination
                    const bills = await Bill.find(userQuery)
                        .populate('userId', 'fullname') // Thêm tham chiếu tới User model để lấy thông tin về fullname của người dùng
                        .select('userId totalAmount createdAt') // Chọn các trường cần thiết
                        .limit(pageSize * 1)
                        .skip((page - 1) * pageSize)
                        .exec();

                    return res.json({
                        totalAmount: totalAmount.length ? totalAmount[0].totalAmount : 0,
                        totalPages: Math.ceil(transactions.length / pageSize),
                        currentPage: page,
                        transactions: bills
                    });// Dừng việc thực thi tiếp tục của hàm sau khi đã gửi phản hồi
                } catch (err) {
                    res.status(500).json({ message: err.message });
                    return; // Dừng việc thực thi tiếp tục của hàm nếu có lỗi
                }
            default:
                return res.status(400).json({ message: 'Invalid period' });
        }

        // Get total amount of transactions
        const totalAmount = await Bill.aggregate([
            { $match: { createdAt: dateQuery } },
            { $group: { _id: null, totalAmount: { $sum: "$totalAmount" } } }
        ]);

        // Get transaction history with pagination
        const bills = await Bill.find({ ...userQuery, createdAt: dateQuery })
            .populate('userId', 'fullname') // Thêm tham chiếu tới User model để lấy thông tin về fullname của người dùng
            .select('userId totalAmount createdAt') // Chọn các trường cần thiết
            .limit(pageSize * 1)
            .skip((page - 1) * pageSize)
            .exec();

        res.json({
            totalAmount: totalAmount.length ? totalAmount[0].totalAmount : 0,
            totalPages: Math.ceil(transactions.length / pageSize),
            currentPage: page,
            transactions: bills
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
