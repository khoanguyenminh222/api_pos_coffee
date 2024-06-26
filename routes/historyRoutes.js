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
    const startOfYear = new Date(date);
    startOfYear.setMonth(0); // Tháng 0 là tháng 1
    startOfYear.setDate(1); // Ngày 1
    startOfYear.setHours(0, 0, 0, 0); // Đặt giờ, phút, giây và mili giây thành 0

    const endOfYear = new Date(date);
    endOfYear.setMonth(11); // Tháng 11 là tháng 12
    endOfYear.setDate(31); // Ngày 31
    endOfYear.setHours(23, 59, 59, 999); // Đặt giờ, phút, giây và mili giây gần cuối ngày
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
            billCodeQuery = { billCode: billCode }; // Tìm theo mã hóa đơn nếu có
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
                    let totalTotalAmount = 0;
                    let currentPage = 1;
                    let totalPages = 1;
                    // Lặp qua từng trang để tính tổng tổng
                    while (currentPage <= totalPages) {
                        const billsOnPage = await Bill.find({ ...userQuery, ...billCodeQuery})
                            .populate('userId')
                            .skip((currentPage - 1) * pageSize)
                            .limit(pageSize)
                            .sort({ createdAt: 'desc' })
                            .exec();

                        // Tính tổng totalAmount trên trang hiện tại và cộng vào tổng tổng
                        let totalAmountOnPage = 0;
                        billsOnPage.forEach(bill => {
                            totalAmountOnPage += bill.totalAmount;
                        });

                        totalTotalAmount += totalAmountOnPage;

                        // Cập nhật số trang và lặp lại nếu còn trang tiếp theo
                        currentPage++;
                        totalPages = Math.ceil(await Bill.countDocuments({ ...userQuery, ...billCodeQuery }) / pageSize);
                    }

                    // Get transaction history with pagination
                    const bills = await Bill.find({ ...userQuery, ...billCodeQuery })
                        .populate('userId') // Thêm tham chiếu tới User model để lấy thông tin về fullname của người dùng
                        .limit(pageSize * 1)
                        .skip((page - 1) * pageSize)
                        .sort({ createdAt: 'desc' })
                        .exec();

                    return res.json({
                        totalAmountSum: totalTotalAmount,
                        totalPages: Math.ceil(totalCount / pageSize),
                        currentPage: page,
                        transactions: bills,
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
        let totalTotalAmount = 0;
        let currentPage = 1;
        let totalPages = 1;

        // Lặp qua từng trang để tính tổng tổng
        while (currentPage <= totalPages) {
            const billsOnPage = await Bill.find({ ...userQuery, ...billCodeQuery, createdAt: dateQuery })
                .populate('userId')
                .skip((currentPage - 1) * pageSize)
                .limit(pageSize)
                .sort({ createdAt: 'desc' })
                .exec();

            // Tính tổng totalAmount trên trang hiện tại và cộng vào tổng tổng
            let totalAmountOnPage = 0;
            billsOnPage.forEach(bill => {
                totalAmountOnPage += bill.totalAmount;
            });

            totalTotalAmount += totalAmountOnPage;

            // Cập nhật số trang và lặp lại nếu còn trang tiếp theo
            currentPage++;
            totalPages = Math.ceil(await Bill.countDocuments({ ...userQuery, ...billCodeQuery, createdAt: dateQuery }) / pageSize);
        }
        // Get transaction history with pagination
        const bills = await Bill.find({ ...userQuery, ...billCodeQuery, createdAt: dateQuery })
            .populate('userId') // Thêm tham chiếu tới User model để lấy thông tin về fullname của người dùng
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .sort({ createdAt: 'desc' })
            .exec()
        
        res.json({
            totalAmountSum: totalTotalAmount,
            totalPages: Math.ceil(totalCount / pageSize),
            currentPage: page,
            transactions: bills,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
