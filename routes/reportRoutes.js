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

// đếm số lượng bán ra
router.post('/items-sold/:period', async (req, res) => {
    const period = req.params.period;
    const dateFromBody = req.body.date ? new Date(req.body.date) : new Date();
    let dateQuery = {};

    switch (period) {
        case "day":
            dateQuery = { $gte: dateFromBody, $lte: dateFromBody };
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
            dateQuery = {};
            break;
        default:
            return res.status(400).json({ message: "Invalid period" });
    }

    try {
        const itemsSold = await Bill.aggregate([
            { $match: { "drinks.createdAt": dateQuery } }, // Lọc theo ngày/tuần/tháng
            { $unwind: "$drinks" },
            { $group: { _id: "$drinks.name", totalQuantity: { $sum: "$drinks.quantity" } } }
        ]);
        res.json(itemsSold);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// doanh thu theo ngày tháng năm
router.post('/revenue/:period', async (req, res) => {
    const period = req.params.period;
    let dateQuery = {};

    // Kiểm tra xem ngày có được cung cấp trong phần thân của yêu cầu không
    const dateFromBody = req.body.date ? new Date(req.body.date) : new Date(); // Sử dụng ngày hiện tại nếu không có ngày được cung cấp

    switch (period) {
        case "day":
            dateQuery = { $gte: dateFromBody, $lte: dateFromBody };
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
            dateQuery = {};
            break;  
        default:
            return res.status(400).json({ message: "Invalid period" });
    }

    try {
        const revenueByPeriod = await Bill.aggregate([
            { $match: { createdAt: dateQuery } },
            { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }
        ]);
        res.json(revenueByPeriod);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// mặt hàng phổ biến
router.post('/popular-items/:period', async (req, res) => {
    const period = req.params.period;
    let dateQuery = {};

    // Kiểm tra xem ngày có được cung cấp trong phần thân của yêu cầu không
    const dateFromBody = req.body.date ? new Date(req.body.date) : new Date();

    switch (period) {
        case "day":
            dateQuery = { $gte: dateFromBody, $lte: dateFromBody };
            break;
        case "week":
            // Nếu có ngày từ phần thân của yêu cầu, sử dụng nó, nếu không, sử dụng ngày hiện tại
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
            dateQuery = {};
            break;
        default:
            return res.status(400).json({ message: "Invalid period" });
    }

    try {
        const popularItems = await Bill.aggregate([
            { $match: { "drinks.createdAt": dateQuery } },
            { $unwind: "$drinks" },
            { $group: { _id: "$drinks.name", totalQuantity: { $sum: "$drinks.quantity" } } },
            { $sort: { totalQuantity: -1 } }
        ]);
        res.json(popularItems);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


module.exports = router;