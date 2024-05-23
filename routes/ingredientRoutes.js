const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middleware/authenticateJWT');
const Ingredient = require('../models/Ingredient');
const IngredientExpense = require('../models/IngredientExpense');
const checkRole = require('../middleware/checkRole');

// Route để lấy tất cả các thành phần
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Trang hiện tại, mặc định là 1 nếu không có tham số truy vấn
    const pageSize = parseInt(req.query.pageSize) || 10; // Số lượng phần tử mỗi trang, mặc định là 10 nếu không có tham số truy vấn
    const search = req.query.search || ''; // Tên cần tìm kiếm, mặc định là chuỗi trống nếu không có tham số truy vấn

    // Tạo các điều kiện tìm kiếm
    const query = {};
    if (search) {
      query.name = { $regex: new RegExp(search, 'i') }; // Tìm kiếm tên chứa từ khóa, không phân biệt chữ hoa/chữ thường
    }

    // Số lượng tổng các thành phần
    const totalCount = await Ingredient.countDocuments(query);

    // Tính toán số trang và phần dữ liệu cần lấy
    const totalPages = Math.ceil(totalCount / pageSize);

    // Lấy danh sách các thành phần với các điều kiện tìm kiếm, phân trang và giới hạn số lượng
    const ingredients = await Ingredient.find(query)
      .limit(pageSize * 1)
      .skip((page - 1) * pageSize)
      .sort({ createdAt: 'desc' })

    res.json({
      totalCount,
      totalPages,
      currentPage: page,
      ingredients
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/getAll', authenticateJWT, async (req,res) => {
  try {
    let ingredients = await Ingredient.find();
    res.json(ingredients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
})

// Route để lấy thành phần theo id
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const ingredient = await Ingredient.findOne(req.params.id);
    res.json(ingredient);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Route để tạo mới một thành phần
router.post('/', authenticateJWT, checkRole('test'), async (req, res) => {
  try {
    // Tìm kiếm nguyên liệu với tên đã cho
    const existingIngredient = await Ingredient.findOne({ name: req.body.name });

    // Nếu nguyên liệu đã tồn tại, trả về lỗi
    if (existingIngredient) {
      return res.status(409).json({ message: 'Nguyên liệu đã tồn tại trong cơ sở dữ liệu.' });
    }
    const ingredient = new Ingredient({
      name: req.body.name,
      quantity: req.body.quantity,
      unit: req.body.unit,
      priceOfUnit: req.body.priceOfUnit ? req.body.priceOfUnit : (req.body.totalPrice / req.body.quantity).toFixed(2),
      totalPrice: req.body.totalPrice
    });
    const newIngredient = await ingredient.save();

    // Tạo bản ghi trong bảng IngredientExpense
    const ingredientExpense = new IngredientExpense({
      ingredient: newIngredient._id,
      quantity: req.body.quantity,
      unit: req.body.unit,
      unitPrice: req.body.priceOfUnit ? req.body.priceOfUnit : (req.body.totalPrice / req.body.quantity).toFixed(2),
      totalAmount: req.body.totalPrice
    });

    // Lưu bản ghi trong bảng IngredientExpense vào cơ sở dữ liệu
    await ingredientExpense.save();
    res.status(201).json({message: 'Thêm mới thành công', newIngredient});
  } catch (err) {
    console.log(err)
    res.status(400).json({ message: err });
  }
});

// Route để cập nhật một thành phần
router.put('/addStock/:id', authenticateJWT, checkRole('test'), async (req, res) => {
  try {
    let ingredient = await Ingredient.findById(req.params.id);
    if (ingredient == null) {
      return res.status(404).json({ message: 'Cannot find ingredient' });
    }
    let action = req.query.action
    switch (action) {
      case 'add':
        ingredient.quantity += req.body.quantity;
        if(req.body.priceOfUnit==''){
          ingredient.priceOfUnit = (req.body.totalPrice / req.body.quantity).toFixed(2);
        }else{
          ingredient.priceOfUnit = req.body.priceOfUnit;
        }
        ingredient.totalPrice = req.body.totalPrice;
        break;
      case 'change':
        ingredient.quantity = req.body.quantity;
        if(req.body.priceOfUnit==''){
          ingredient.priceOfUnit = (req.body.totalPrice / req.body.quantity).toFixed(2);
        }else{
          ingredient.priceOfUnit = req.body.priceOfUnit;
        }
        ingredient.totalPrice = req.body.totalPrice;
        break;
      default:
        return res.status(400).json({ message: 'Invalid action' });
    }
    
    let updatedIngredient = await ingredient.save();
    // Lưu thông tin chi phí nguyên liệu
    const ingredientExpense = new IngredientExpense({
      ingredient: updatedIngredient._id,
      quantity: req.body.quantity,
      unit: updatedIngredient.unit,
      unitPrice: updatedIngredient.priceOfUnit,
      totalAmount: req.body.totalPrice
    });
    let savedIngredientExpense = await ingredientExpense.save();

    res.json({message: 'Cập nhật thành công', updatedIngredient, savedIngredientExpense});
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Route để cập nhật một thành phần
router.patch('/:id', authenticateJWT, checkRole('test'), async (req, res) => {
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
    if (req.body.priceOfUnit != null) {
      ingredient.priceOfUnit = req.body.priceOfUnit;
    }
    if (req.body.priceOfUnit==''){
      ingredient.priceOfUnit = (req.body.totalPrice / req.body.quantity).toFixed(2);
    }
    if (req.body.totalPrice != null) {
      ingredient.totalPrice = req.body.totalPrice;
    }
    const updatedIngredient = await ingredient.save();
    res.status(201).json({ message: 'Cập nhật thành công', updatedIngredient});
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Route để xoá một thành phần
router.delete('/:id', authenticateJWT, checkRole('test'), async (req, res) => {
  try {
    const ingredient = await Ingredient.findByIdAndDelete(req.params.id);
    if (!ingredient) {
      return res.status(404).json({ message: 'Cannot find ingredient' });
    }
    res.status(201).json({ message: 'Xoá thành công' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
