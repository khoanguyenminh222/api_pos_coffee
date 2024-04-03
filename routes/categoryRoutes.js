const express = require("express");
const router = express.Router();
const Category = require("../models/Category");
const mongoose = require('mongoose');

// Route GET: Lấy danh sách tất cả các categories
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find().timeout(10000); // Thiết lập thời gian chờ cho truy vấn
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Route GET: Lấy một category theo ID
router.get("/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).timeout(10000); // Thiết lập thời gian chờ cho truy vấn
    if (category == null) {
      return res.status(404).json({ message: "Không tìm thấy category" });
    }
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Route POST: Tạo mới một category
router.post("/", async (req, res) => {
  const category = new Category({
    name: req.body.name,
    img: req.body.img
  });

  try {
    const newCategory = await category.save();
    res.status(201).json(newCategory);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Route PUT: Cập nhật một category
router.put("/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).timeout(10000); // Thiết lập thời gian chờ cho truy vấn
    if (category == null) {
      return res.status(404).json({ message: "Không tìm thấy category" });
    }

    if (req.body.name != null) {
      category.name = req.body.name;
    }
    if (req.body.img != null) {
      category.img = req.body.img;
    }

    const updatedCategory = await category.save();
    res.json(updatedCategory);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Route DELETE: Xóa một category
router.delete("/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).timeout(10000); // Thiết lập thời gian chờ cho truy vấn
    if (category == null) {
      return res.status(404).json({ message: "Không tìm thấy category" });
    }

    await category.remove();
    res.json({ message: "Đã xóa category" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
