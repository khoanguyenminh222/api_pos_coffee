const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require('fs');
const os = require('os');
const path = require("path");
const admin = require("firebase-admin");


const Category = require("../models/Category");

// Đường dẫn đến thư mục tạm
const tempDir = path.join(os.tmpdir(), 'uploads');

// Kiểm tra xem thư mục tạm có tồn tại không
if (!fs.existsSync(tempDir)) {
    // Nếu không tồn tại, tạo thư mục
    fs.mkdirSync(tempDir);
    console.log('Thư mục tạm đã được tạo.');
} else {
    console.log('Thư mục tạm đã tồn tại.');
}


// Cấu hình multer để lưu tệp vào thư mục tạm của Express
const storage = multer.diskStorage({
  destination: function (req, file, cb) {

    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Route GET: Lấy danh sách tất cả các categories
router.get("/",  async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Route GET: Lấy một category theo ID
router.get("/:id",  async (req, res) => {
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

// Route POST: Tải hình ảnh lên Firebase và tạo mới một category
router.post("/",  upload.single("img"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Tạo đường dẫn lưu trữ trên Firebase
    const firebaseFilePath = `categories/${Date.now()}${path.extname(file.originalname)}`;

    // Tải tệp lên Firebase Storage
    await admin.storage().bucket().upload(file.path, {
      destination: firebaseFilePath
    });

    // Xóa tệp tạm trên máy chủ Express sau khi tải lên hoàn thành
    fs.unlinkSync(file.path);

    // Tạo mới category với đường dẫn hình ảnh từ Firebase
    const category = new Category({
      name: req.body.name,
      img: firebaseFilePath
    });

    const newCategory = await category.save();
    res.status(201).json(newCategory);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Route PUT: Cập nhật hình ảnh của một category trên Firebase và trong cơ sở dữ liệu
router.put("/:id",  upload.single("img"), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Không tìm thấy category" });
    }

    // Nếu có tệp được tải lên, tải lên Firebase Storage
    if (req.file) {
      const file = req.file;

      // Tạo đường dẫn lưu trữ trên Firebase
      const firebaseFilePath = `categories/${Date.now()}${path.extname(file.originalname)}`;

      // Tải tệp lên Firebase Storage
      await admin.storage().bucket().upload(file.path, {
        destination: firebaseFilePath
      });

      // Xóa tệp tạm trên máy chủ Express sau khi tải lên hoàn thành
      fs.unlinkSync(file.path);

      // Cập nhật đường dẫn hình ảnh mới trong cơ sở dữ liệu
      category.img = firebaseFilePath;
    }

    // Nếu có tên category được cung cấp, cập nhật tên category
    if (req.body.name) {
      category.name = req.body.name;
    }

    // Lưu category đã cập nhật trong cơ sở dữ liệu
    const updatedCategory = await category.save();
    res.status(201).json(updatedCategory);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Route DELETE: Xóa một category
router.delete("/:id",  async (req, res) => {
  try {
    const category = await Category.findOneAndDelete({ _id: req.params.id });
    if (!category) {
      return res.status(404).json({ message: "Không tìm thấy category" });
    }

    res.status(201).json({ message: "Đã xóa category" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
