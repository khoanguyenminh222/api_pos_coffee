const express = require('express');
const router = express.Router();
const Bill = require('../models/Bill');
const authenticateJWT = require('../middleware/authenticateJWT');

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
router.get('/:period/:userId?', authenticateJWT, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Trang mặc định là 1 nếu không có tham số page
        const pageSize = parseInt(req.query.pageSize) || 10; // Số lượng mục trên mỗi trang mặc định là 10 nếu không có tham số pageSize
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

        // Thêm điều kiện tìm kiếm theo mã hóa đơn
        const billCode = req.query.billCode; // Lấy mã hóa đơn từ query string
        let billCodeQuery = {}; // Điều kiện tìm kiếm cho mã hóa đơn

        if (billCode) {
            billCodeQuery = { _id: billCode }; // Tìm theo mã hóa đơn nếu có
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
                    const totalCount = await Bill.countDocuments({
                        ...userQuery,
                        ...billCodeQuery
                    });
                    // Get total amount of transactions
                    const totalAmountSum = await Bill.aggregate([
                        { $match: { ...userQuery, ...billCodeQuery } }, // Thêm điều kiện tìm kiếm mã hóa đơn nếu có
                        { $group: { _id: null, totalAmount: { $sum: "$totalAmount" } } }
                    ]);

                    // Get transaction history with pagination
                    const bills = await Bill.find({ ...userQuery, ...billCodeQuery })
                        .populate('userId', 'fullname') // Thêm tham chiếu tới User model để lấy thông tin về fullname của người dùng
                        .select('userId totalAmount createdAt') // Chọn các trường cần thiết
                        .limit(pageSize * 1)
                        .skip((page - 1) * pageSize)
                        .exec();

                    return res.json({
                        totalAmountSum: totalAmountSum.length ? totalAmountSum[0].totalAmount : 0,
                        totalPages: Math.ceil(totalCount / pageSize),
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

        const totalCount = await Bill.countDocuments({
            ...userQuery,
            ...billCodeQuery,
            createdAt: dateQuery
        });
        // Get total amount of transactions
        const totalAmountSum = await Bill.aggregate([
            { $match: { ...userQuery, ...billCodeQuery, createdAt: dateQuery } },
            { $group: { _id: null, totalAmount: { $sum: "$totalAmount" } } }
        ]);

        // Get transaction history with pagination
        const bills = await Bill.find({ ...userQuery, ...billCodeQuery, createdAt: dateQuery })
            .populate('userId', 'fullname') // Thêm tham chiếu tới User model để lấy thông tin về fullname của người dùng
            .select('userId totalAmount createdAt') // Chọn các trường cần thiết
            .limit(pageSize * 1)
            .skip((page - 1) * pageSize)
            .sort({ createdAt: 'desc' })
            .exec()
            
        res.json({
            totalAmountSum: totalAmountSum.length ? totalAmountSum[0].totalAmount : 0,
            totalPages: Math.ceil(totalCount / pageSize),
            currentPage: page,
            transactions: bills
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
