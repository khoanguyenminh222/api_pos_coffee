const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const Category = require("../models/Category");

// Cấu hình multer để lưu file vào thư mục public
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/images/categories"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Route GET: Lấy danh sách tất cả các categories
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Route GET: Lấy một category theo ID
router.get("/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (category == null) {
      return res.status(404).json({ message: "Không tìm thấy category" });
    }
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Route POST: Tạo mới một category
router.post("/", upload.single("img"), async (req, res) => {
  const category = new Category({
    name: req.body.name,
    img: "/images/" + req.file.filename, // Lưu đường dẫn của hình ảnh trong thư mục public
  });

  try {
    const newCategory = await category.save();
    res.status(201).json(newCategory);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Route PUT: Cập nhật một category
router.put("/:id", upload.single("img"), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (category == null) {
      return res.status(404).json({ message: "Không tìm thấy category" });
    }

    if (req.body.name != null) {
      category.name = req.body.name;
    }
    if (req.file != null) {
      category.img = "/images/" + req.file.filename; // Lưu đường dẫn của hình ảnh trong thư mục public
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
    const category = await Category.findById(req.params.id);
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
