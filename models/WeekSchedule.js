const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
});

const WeekScheduleSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Tham chiếu đến User
    weeks: [{
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        monday: [shiftSchema],
        tuesday: [shiftSchema],
        wednesday: [shiftSchema],
        thursday: [shiftSchema],
        friday: [shiftSchema],
        saturday: [shiftSchema],
        sunday: [shiftSchema]
    }]
});

const WeekSchedule = mongoose.model('WeekSchedule', WeekScheduleSchema);
module.exports = WeekSchedule;
