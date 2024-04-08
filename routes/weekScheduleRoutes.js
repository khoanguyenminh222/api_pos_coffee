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

router.get('/', async (req, res) => {
    try {
        // Lấy ngày bắt đầu và kết thúc của tuần từ query parameters
        const { startDate, endDate } = req.query;

        // Kiểm tra xem các query parameters đã được cung cấp hay không
        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Missing startDate or endDate parameters' });
        }

        // Truy vấn các bản ghi trong bảng WeekSchedule
        const schedules = await WeekSchedule.find({
            'weeks.startDate': { $gte: new Date(startDate) },
            'weeks.endDate': { $lte: new Date(endDate) }
        }).populate('user'); // Sử dụng populate để lấy thông tin của user đồng thời

        // Trả về kết quả
        res.json(schedules);
    } catch (error) {
        console.error('Error finding schedules for the week:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Tạo lịch làm việc cho một tuần của một nhân viên
router.post('/', async (req, res) => {
    const { userId, weeks } = req.body;

    try {
        // Kiểm tra xem người dùng đã có lịch làm việc hay chưa
        const existingSchedule = await WeekSchedule.findOne({ user: userId });

        if (existingSchedule) {
            // Nếu người dùng đã có lịch làm việc
            const { startDate, endDate } = weeks[0]; // Lấy start date và end date của tuần mới
            const { weeks: existingWeeks } = existingSchedule;

            // Kiểm tra xem tuần mới có nằm ngoài vùng start date và end date của các tuần hiện có hay không
            const isOutsideRange = existingWeeks.every(week => {
                return (new Date(startDate) < new Date(week.startDate) && new Date(endDate) < new Date(week.startDate)) ||
                       (new Date(startDate) > new Date(week.endDate) && new Date(endDate) > new Date(week.endDate));
            });

            if (isOutsideRange) {
                // Nếu tuần mới nằm ngoài vùng start date và end date của các tuần hiện có
                existingSchedule.weeks.push(...weeks);
                const updatedSchedule = await existingSchedule.save();
                return res.status(201).json(updatedSchedule);
            } else {
                return res.status(400).json({ message: 'Tuần mới phải nằm ngoài vùng của các tuần hiện có.' });
            }
        } else {
            // Nếu người dùng chưa có lịch làm việc
            const newWeekSchedule = await WeekSchedule.create({ user: userId, weeks });
            return res.status(201).json(newWeekSchedule);
        }
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