const express = require('express');
const router = express.Router();
const WeekSchedule = require('../models/WeekSchedule');
const authenticateJWT = require('../middleware/authenticateJWT');
const checkRole = require('../middleware/checkRole');
// Lấy thông tin lịch làm việc của một nhân viên
router.get('/:userId', authenticateJWT,  async (req, res) => {
    const userId = req.params.userId;
    try {
        // Lấy ngày bắt đầu và kết thúc của tuần từ query parameters
        const { startDate, endDate } = req.query;

        // Kiểm tra xem các query parameters đã được cung cấp hay không
        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Missing startDate or endDate parameters' });
        }

        // Truy vấn lịch làm việc của người dùng dựa trên userId và khoảng thời gian
        const schedule = await WeekSchedule.findOne({
            user: userId,
            $and: [
                { 'weeks.startDate': { $lte: new Date(endDate) } },
                { 'weeks.endDate': { $gte: new Date(startDate) } }
            ]
        });

        if (!schedule) {
            return res.status(404).json({ message: 'Không tìm thấy lịch làm việc cho người dùng trong khoảng thời gian đã cho.' });
        }

        // Lọc các tuần trong khoảng thời gian đã chỉ định
        const filteredWeeks = schedule.weeks.filter(week =>
            new Date(week.startDate) <= new Date(endDate) && new Date(week.endDate) >= new Date(startDate)
        );

        // Cập nhật schedule với các tuần đã lọc
        schedule.weeks = filteredWeeks;

        // Trả về kết quả
        res.json(schedule);
    } catch (error) {
        console.error('Error finding schedule for the user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/', authenticateJWT,  async (req, res) => {
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
router.post('/', authenticateJWT, checkRole('test'), async (req, res) => {
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
                return res.status(400).json({ message: 'Người này đã có lịch ở tuần hiện tại.' });
            }
        } else {
            // Nếu người dùng chưa có lịch làm việc
            const newWeekSchedule = await WeekSchedule.create({ user: userId, weeks });
            return res.status(201).json({ message: 'Tạo mới thành công', newWeekSchedule});
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Đã xảy ra lỗi khi tạo lịch làm việc' });
    }
});

// Cập nhật lịch làm việc của một nhân viên
router.put('/:userId', authenticateJWT, checkRole('test'), async (req, res) => {
    const userId = req.params.userId;
    const { startDay, endDay, newWeeks } = req.body;

    try {
        // Tìm lịch làm việc của người dùng
        const existingSchedule = await WeekSchedule.findOne({ user: userId });

        if (existingSchedule) {
            // Nếu người dùng đã có lịch làm việc
            const { weeks } = existingSchedule;

            // Kiểm tra xem lịch làm việc của người dùng có tuần nào trong khoảng start day và end day không
            const foundWeekIndex = weeks.findIndex(week => {
                return new Date(week.startDate) <= new Date(startDay) && new Date(week.endDate) >= new Date(endDay);
            });

            if (foundWeekIndex !== -1) {
                // Nếu tìm thấy tuần trong khoảng start day và end day
                // Cập nhật lại tuần đó với dữ liệu mới
                weeks[foundWeekIndex] = { startDate: startDay, endDate: endDay, ...newWeeks };
                const updatedSchedule = await existingSchedule.save();
                return res.status(201).json({ message: 'Cập nhật thành công', updatedSchedule });
            } else {
                return res.status(404).json({ message: 'Không tìm thấy tuần trong khoảng thời gian đã cho.' });
            }
        } else {
            return res.status(404).json({ message: 'Người dùng không có lịch làm việc.' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Đã xảy ra lỗi khi cập nhật lịch làm việc.' });
    }
});

// Xóa lịch làm việc của một người dùng trong một khoảng thời gian
router.delete('/:userId', authenticateJWT, checkRole('test'), async (req, res) => {
    const userId = req.params.userId;
    try {
        // Lấy ngày bắt đầu và kết thúc của khoảng thời gian từ query parameters
        const { startDate, endDate } = req.query;

        // Kiểm tra xem các query parameters đã được cung cấp hay không
        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Missing startDate or endDate parameters' });
        }

        // Xóa lịch làm việc của người dùng dựa trên userId và khoảng thời gian
        const result = await WeekSchedule.findOneAndUpdate(
            {
                user: userId,
                $and: [
                    { 'weeks.startDate': { $lte: new Date(endDate) } },
                    { 'weeks.endDate': { $gte: new Date(startDate) } }
                ]
            },
            { $pull: { weeks: { startDate: { $gte: new Date(startDate) }, endDate: { $lte: new Date(endDate) } } } },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({ message: 'Không tìm thấy lịch làm việc để xóa cho người dùng trong khoảng thời gian đã cho.' });
        }

        res.status(201).json({ message: 'Xóa lịch làm việc thành công' });
    } catch (error) {
        console.error('Lỗi khi xóa lịch làm việc của người dùng:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
});

module.exports = router;