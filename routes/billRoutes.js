const express = require('express');
const router = express.Router();

const Bill = require('../models/Bill');
const Drink = require('../models/Drink');
const Ingredient = require('../models/Ingredient');
const TransactionIngredient = require('../models/TransactionIngredient');
const authenticateJWT = require('../middleware/authenticateJWT');

// Route để tạo hóa đơn mới
// Route để tạo hóa đơn mới và trừ đi thành phần nguyên liệu từ kho
router.post('/', async (req, res) => {
    const { userId, drinks, totalAmount } = req.body;
    
    try {
        // Tạo một hóa đơn mới
        const newBill = new Bill({ userId, drinks, totalAmount });
        await newBill.save();

        // Lặp qua từng đồ uống trong danh sách hóa đơn
        for (const drink of drinks) {
            // Tìm đồ uống trong cơ sở dữ liệu
            const foundDrink = await Drink.findById(drink.id);
            if (!foundDrink) {
                throw new Error(`Không tìm thấy đồ uống có ID ${drink.id}`);
            }
            // Lặp qua từng thành phần nguyên liệu của đồ uống và trừ đi từ kho
            for (const ingredient of drink.ingredients) {
                const ingredientId = ingredient.ingredient._id;
                const ingredientQuantity = ingredient.quantity;

                // Tìm nguyên liệu trong kho
                const foundIngredient = await Ingredient.findById(ingredientId);
                if (!foundIngredient) {
                    throw new Error(`Không tìm thấy nguyên liệu có ID ${ingredientId}`);
                }

                const newTransaction = new TransactionIngredient({
                    drink: drink.id,
                    ingredient: ingredient.ingredient._id,
                    quantity_transaction: ingredient.quantity*drink.quantity,
                    quantity_prevTransaction: foundIngredient.quantity, // Điều này cần được truyền từ client
                    priceOfUnit: foundIngredient.priceOfUnit,
                    price: (ingredient.quantity*foundIngredient.priceOfUnit*drink.quantity).toFixed(2)
                });
                await newTransaction.save();

                // Trừ đi số lượng nguyên liệu từ kho
                foundIngredient.quantity -= ingredientQuantity*drink.quantity;
                await foundIngredient.save();
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
        const bill = await Bill.findById(req.params.id).populate('drinks.id');
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