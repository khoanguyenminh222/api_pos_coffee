const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require('fs');
const os = require('os');
const path = require("path");
const admin = require("firebase-admin");

const Drink = require("../models/Drink");

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

// Route GET: Lấy danh sách tất cả các đồ uống
router.get("/", async (req, res) => {
  try {
    const drinks = await Drink.find();
    res.json(drinks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Route GET: Lấy tất cả các đồ uống của một danh mục
router.get("/category/:categoryId", async (req, res) => {
    try {
      const drinks = await Drink.find({ categoryId: req.params.categoryId });
      res.json(drinks);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

// Route GET: Lấy một đồ uống theo ID
router.get("/:id", async (req, res) => {
  try {
    const drink = await Drink.findById(req.params.id);
    if (drink == null) {
      return res.status(404).json({ message: "Không tìm thấy đồ uống" });
    }
    res.json(drink);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Route POST: Tải hình ảnh lên Firebase và tạo mới một đồ uống
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Tạo đường dẫn lưu trữ trên Firebase
    const firebaseFilePath = `drinks/${Date.now()}${path.extname(file.originalname)}`;

    // Tải tệp lên Firebase Storage
    await admin.storage().bucket().upload(file.path, {
      destination: firebaseFilePath
    });

    // Xóa tệp tạm trên máy chủ Express sau khi tải lên hoàn thành
    fs.unlinkSync(file.path);

    // Tạo mới đồ uống với đường dẫn hình ảnh từ Firebase
    const drink = new Drink({
      name: req.body.name,
      price: req.body.price,
      image: firebaseFilePath,
      categoryId: req.body.categoryId, // Phải cung cấp ID của danh mục
      options: req.body.options
    });

    const newDrink = await drink.save();
    res.status(201).json(newDrink);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Route PUT: Cập nhật hình ảnh của một đồ uống trên Firebase và trong cơ sở dữ liệu
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const drink = await Drink.findById(req.params.id);
    if (!drink) {
      return res.status(404).json({ message: "Không tìm thấy đồ uống" });
    }

    // Nếu có tệp được tải lên, tải lên Firebase Storage
    if (req.file) {
      const file = req.file;

      // Tạo đường dẫn lưu trữ trên Firebase
      const firebaseFilePath = `drinks/${Date.now()}${path.extname(file.originalname)}`;

      // Tải tệp lên Firebase Storage
      await admin.storage().bucket().upload(file.path, {
        destination: firebaseFilePath
      });

      // Xóa tệp tạm trên máy chủ Express sau khi tải lên hoàn thành
      fs.unlinkSync(file.path);

      // Cập nhật đường dẫn hình ảnh mới trong cơ sở dữ liệu
      drink.image = firebaseFilePath;
    }

    // Cập nhật thông tin đồ uống
    drink.name = req.body.name || drink.name;
    drink.price = req.body.price || drink.price;
    drink.categoryId = req.body.categoryId || drink.categoryId; // Cập nhật ID của danh mục
    drink.options = req.body.options || drink.options;

    // Lưu đồ uống đã cập nhật trong cơ sở dữ liệu
    const updatedDrink = await drink.save();
    res.json(updatedDrink);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Route DELETE: Xóa một đồ uống
router.delete("/:id", async (req, res) => {
  try {
    const drink = await Drink.findOneAndDelete({ _id: req.params.id });
    if (!drink) {
      return res.status(404).json({ message: "Không tìm thấy đồ uống" });
    }

    res.json({ message: "Đã xóa đồ uống" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
