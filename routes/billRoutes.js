const express = require('express');
const router = express.Router();

const Bill = require('../models/Bill');
const authenticateJWT = require('../middleware/authenticateJWT');

// Route để tạo hóa đơn mới
router.post('/', authenticateJWT,async (req, res) => {
    const { drinks } = req.body;
    try {
        const newBill = new Bill(req.body);
        await newBill.save();
        for (const drink of drinks) {
            // Lặp qua từng thành phần của mỗi đồ uống
            for (const { id: drinkId, quantity } of drink.ingredients) {
                // Tìm đồ uống trong cơ sở dữ liệu
                const foundDrink = await Drink.findById(drinkId).populate('ingredients.ingredientId');
                if (!foundDrink) {
                    throw new Error(`Không tìm thấy đồ uống có ID ${drinkId}`);
                }

                // Trừ lượng thành phần từ kho
                for (const { ingredientId, quantity: ingredientQuantity } of foundDrink.ingredients) {
                    const ingredient = await Ingredient.findById(ingredientId);
                    if (!ingredient) {
                        throw new Error(`Không tìm thấy thành phần có ID ${ingredientId}`);
                    }
                    ingredient.quantity -= ingredientQuantity * quantity;
                    await ingredient.save();
                }
            }
        }
        res.status(201).json(newBill);
    } catch (error) {
        console.error('Lỗi khi tạo hóa đơn:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra, vui lòng thử lại sau' });
    }
});

// Route để xoá hóa đơn
router.delete('/:id', authenticateJWT, async (req, res) => {
    try {
        const deletedBill = await Bill.findByIdAndDelete(req.params.id);
        if (!deletedBill) {
            return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });
        }
        res.json({ message: 'Hóa đơn đã được xoá thành công' });
    } catch (error) {
        console.error('Lỗi khi xoá hóa đơn:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra, vui lòng thử lại sau' });
    }
});

// Route để cập nhật hóa đơn
router.put('/:id', authenticateJWT, async (req, res) => {
    try {
        const updatedBill = await Bill.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedBill) {
            return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });
        }
        res.json(updatedBill);
    } catch (error) {
        console.error('Lỗi khi cập nhật hóa đơn:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra, vui lòng thử lại sau' });
    }
});

// Route để lấy một hóa đơn bằng ID
router.get('/:id', authenticateJWT, async (req, res) => {
    try {
        const bill = await Bill.findById(req.params.id);
        if (!bill) {
            return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });
        }
        res.json(bill);
    } catch (error) {
        console.error('Lỗi khi lấy hóa đơn theo ID:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra, vui lòng thử lại sau' });
    }
});

// Route để lấy tất cả các hóa đơn
router.get('/', authenticateJWT, async (req, res) => {
    try {
        const bills = await Bill.find();
        res.json(bills);
    } catch (error) {
        console.error('Lỗi khi lấy tất cả các hóa đơn:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra, vui lòng thử lại sau' });
    }
});

// Route để lấy các hóa đơn của một người dùng
router.get('/user/:userId', authenticateJWT, async (req, res) => {
    try {
        const userId = req.params.userId;
        // Truy vấn các hóa đơn của người dùng dựa trên userId
        const userBills = await Bill.find({ userId: userId });
        res.json(userBills);
    } catch (error) {
        console.error('Lỗi khi lấy các hóa đơn của người dùng:', error);
        res.status(500).json({ message: 'Có lỗi xảy ra, vui lòng thử lại sau' });
    }
});

module.exports = router;