const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middleware/authenticateJWT');
const Ingredient = require('../models/Ingredient');

// Route để lấy tất cả các thành phần
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const ingredients = await Ingredient.find();
    res.json(ingredients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Route để tạo mới một thành phần
router.post('/', authenticateJWT, async (req, res) => {
  const ingredient = new Ingredient({
    name: req.body.name,
    quantity: req.body.quantity,
    unit: req.body.unit,
    price: req.body.price
  });
  try {
    const newIngredient = await ingredient.save();
    res.status(201).json(newIngredient);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Route để cập nhật một thành phần
router.patch('/:id', authenticateJWT, async (req, res) => {
  try {
    const ingredient = await Ingredient.findById(req.params.id);
    if (ingredient == null) {
      return res.status(404).json({ message: 'Cannot find ingredient' });
    }
    if (req.body.name != null) {
      ingredient.name = req.body.name;
    }
    if (req.body.quantity != null) {
      ingredient.quantity = req.body.quantity;
    }
    if (req.body.unit != null) {
      ingredient.unit = req.body.unit;
    }
    if (req.body.price != null) {
      ingredient.price = req.body.price;
    }
    const updatedIngredient = await ingredient.save();
    res.json(updatedIngredient);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Route để xoá một thành phần
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const ingredient = await Ingredient.findByIdAndDelete(req.params.id);
    if (!ingredient) {
      return res.status(404).json({ message: 'Cannot find ingredient' });
    }
    res.status(200).json({ message: 'Deleted ingredient' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
