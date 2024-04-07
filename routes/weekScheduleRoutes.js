const express = require('express');
const router = express.Router();
const WeekSchedule = require('../models/WeekSchedule');

// Lấy thông tin lịch làm việc của một nhân viên
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const weekSchedule = await WeekSchedule.findOne({ user: userId });
        if (!weekSchedule) {
            return res.status(404).json({ message: 'Không tìm thấy lịch làm việc cho nhân viên này' });
        }
        return res.status(200).json(weekSchedule);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy thông tin lịch làm việc của nhân viên' });
    }
});

// Tạo lịch làm việc cho một tuần của một nhân viên
router.post('/', async (req, res) => {
    try {
        const newWeekSchedule = await WeekSchedule.create(req.body);
        return res.status(201).json(newWeekSchedule);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Đã xảy ra lỗi khi tạo lịch làm việc' });
    }
});

// Cập nhật lịch làm việc của một nhân viên
router.put('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const updatedWeekSchedule = await WeekSchedule.findOneAndUpdate({ user: userId }, req.body, { new: true });
        if (!updatedWeekSchedule) {
            return res.status(404).json({ message: 'Không tìm thấy lịch làm việc cho nhân viên này' });
        }
        return res.status(201).json(updatedWeekSchedule);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Đã xảy ra lỗi khi cập nhật lịch làm việc của nhân viên' });
    }
});

// Xóa lịch làm việc của một nhân viên
router.delete('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const deletedWeekSchedule = await WeekSchedule.findOneAndDelete({ user: userId });
        if (!deletedWeekSchedule) {
            return res.status(404).json({ message: 'Không tìm thấy lịch làm việc cho nhân viên này' });
        }
        return res.status(201).json({ message: 'Lịch làm việc của nhân viên đã được xóa' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Đã xảy ra lỗi khi xóa lịch làm việc của nhân viên' });
    }
});

module.exports = router;