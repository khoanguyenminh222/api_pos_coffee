// Import các thư viện cần thiết và Promotion model
const express = require('express');
const router = express.Router();
const Promotion = require('../models/Promotion');

// API endpoint để lấy tất cả các Promotion
router.get('/', async (req, res) => {
    try {
        const promotions = await Promotion.find();
        res.json(promotions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// API endpoint để thêm một Promotion mới
router.post('/', async (req, res) => {
    try {
        // Extract promotion details from request body
        const { name, description, type, buyItems, freeItem, discountPercent, fixedPriceItems, buyCategoryItems, freeCategoryItems, startDate, endDate, isActive } = req.body;

        // Create a new promotion object based on promotion type
        let newPromotion;
        switch (type) {
            case 'buy_get_free':
                newPromotion = new Promotion({
                    name,
                    description,
                    type,
                    buyItems,
                    freeItem,
                    startDate,
                    endDate,
                    isActive
                });
                break;
            case 'discount':
                newPromotion = new Promotion({
                    name,
                    description,
                    type,
                    discountPercent,
                    startDate,
                    endDate,
                    isActive
                });
                break;
            case 'fixed_price':
                newPromotion = new Promotion({
                    name,
                    description,
                    type,
                    fixedPriceItems,
                    startDate,
                    endDate,
                    isActive
                });
            case 'buy_category_get_free':
                newPromotion = new Promotion({
                    name,
                    description,
                    type,
                    buyCategoryItems,
                    freeCategoryItems,
                    startDate,
                    endDate,
                    isActive
                });
            default:
                return res.status(400).json({ error: 'Invalid promotion type' });
        }

        // Save the new promotion to the database
        await newPromotion.save();

        // Return success response
        res.status(201).json({ message: 'Promotion added successfully', promotion: newPromotion });
    } catch (error) {
        // Handle errors
        console.error('Error adding promotion:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API endpoint để sửa thông tin một Promotion
router.put('/:id', async (req, res) => {
    try {
        let updatedPromotion = await Promotion.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedPromotion);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// API endpoint để xoá một Promotion
router.delete('/:id', async (req, res) => {
    try {
        await Promotion.findByIdAndDelete(req.params.id);
        res.json({ message: 'Promotion deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
