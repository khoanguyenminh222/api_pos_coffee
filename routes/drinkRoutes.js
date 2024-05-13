const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const os = require('os');
const path = require('path');
const admin = require('firebase-admin');
const Drink = require('../models/Drink');
const authenticateJWT = require('../middleware/authenticateJWT');

const tempDir = path.join(os.tmpdir(), 'uploads');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
    console.log('Temporary directory has been created.');
} else {
    console.log('Temporary directory already exists.');
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

router.get('/', authenticateJWT, async (req, res) => {
  try {
    let {search} = req.query
    let query = {}; // Tạo một object query trống để lọc

    // Nếu có tham số tìm kiếm, thêm điều kiện vào query
    if (search) {
      // Sử dụng RegExp để tạo một biểu thức chính quy từ giá trị tìm kiếm, thêm 'i' để tìm kiếm không phân biệt chữ hoa thường
      query = { name: { $regex: search, $options: 'i' } }
    }
    const drinks = await Drink.find(query);
    res.json(drinks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/category/:categoryId", authenticateJWT, async (req, res) => {
  try {
    const drinks = await Drink.find({ categoryId: req.params.categoryId });
    res.json(drinks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:drinkId/promotions', async (req, res) => {
  try {
    const drink = await Drink.findById(req.params.drinkId);
    if (!drink) {
      return res.status(404).json({ message: 'Drink not found' });
    }
    drink.promotion = req.body.promotionId;
    await drink.save();
    res.status(201).json(drink);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const drink = await Drink.findById(req.params.id).populate('ingredients.ingredient');
    if (!drink) {
      return res.status(404).json({ message: 'Drink not found' });
    }
    res.json(drink);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', authenticateJWT, upload.single('image'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const firebaseFilePath = `drinks/${Date.now()}${path.extname(file.originalname)}`;
    await admin.storage().bucket().upload(file.path, {
      destination: firebaseFilePath
    });
    fs.unlinkSync(file.path);

    const { name, prices, categoryId, options } = req.body;

    const newDrink = new Drink({
      name: name,
      prices: prices,
      image: firebaseFilePath,
      categoryId: categoryId,
      options: options
    });

    const savedDrink = await newDrink.save();
    res.status(201).json(savedDrink);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', authenticateJWT, upload.single('image'), async (req, res) => {
  try {
    const drink = await Drink.findById(req.params.id);
    if (!drink) {
      return res.status(404).json({ message: 'Drink not found' });
    }

    if (req.file) {
      const file = req.file;
      const firebaseFilePath = `drinks/${Date.now()}${path.extname(file.originalname)}`;
      await admin.storage().bucket().upload(file.path, {
        destination: firebaseFilePath
      });
      fs.unlinkSync(file.path);
      drink.image = firebaseFilePath;
    }

    const { name, prices, categoryId, options } = req.body;

    if (name) drink.name = name;
    if (prices) drink.prices = prices;
    if (categoryId) drink.categoryId = categoryId;
    if (options) drink.options = options;

    const updatedDrink = await drink.save();
    res.status(201).json(updatedDrink);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const drink = await Drink.findOneAndDelete({ _id: req.params.id });
    if (!drink) {
      return res.status(404).json({ message: 'Drink not found' });
    }
    res.status(201).json({ message: 'Drink deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/ingredients', async (req, res) => {
  const { id } = req.params;
  const { ingredients } = req.body;

  try {
      // Kiểm tra xem đồ uống có tồn tại không
      const drink = await Drink.findById(id);
      if (!drink) {
          return res.status(404).json({ message: 'Không tìm thấy đồ uống' });
      }

      // Tạo một mảng chứa id của các thành phần có trong yêu cầu
      const requestedIngredientIds = ingredients.map(item => item._id);

      // Lặp qua mỗi thành phần hiện tại của đồ uống
      for (let i = drink.ingredients.length - 1; i >= 0; i--) {
          const currentIngredient = drink.ingredients[i];
          
          // Kiểm tra xem thành phần hiện tại có trong yêu cầu không
          if (!requestedIngredientIds.includes(currentIngredient._id.toString())) {
              // Nếu không, xoá thành phần đó khỏi danh sách
              drink.ingredients.splice(i, 1);
          }
      }

      // Lặp qua mỗi thành phần trong yêu cầu
      for (const { _id, quantity } of ingredients) {
          // Tìm xem có tồn tại thành phần trong danh sách hiện tại của đồ uống không
          const existingIngredient = drink.ingredients.find(item => item.ingredient.equals(_id));
          if (existingIngredient) {
              // Nếu tồn tại, cập nhật số lượng mới cho thành phần
              existingIngredient.quantity = quantity; 
          } else {
              // Nếu không tồn tại, thêm mới thành phần
              drink.ingredients.push({
                  ingredient: _id,
                  quantity: quantity
              });
          }
      }

      // Lưu drink đã được cập nhật vào cơ sở dữ liệu
      await drink.save();

      res.status(201).json({ message: 'Thành công', drink });
  } catch (error) {
      console.error('Lỗi khi thêm ingredients vào drink:', error);
      res.status(500).json({ message: 'Có lỗi xảy ra, vui lòng thử lại sau' });
  }
});


module.exports = router;
