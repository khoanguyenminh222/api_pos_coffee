const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const os = require('os');
const path = require('path');
const admin = require('firebase-admin');
const Drink = require('../models/Drink');


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

router.get('/',  async (req, res) => {
  try {
    const drinks = await Drink.find();
    res.json(drinks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/category/:categoryId",  async (req, res) => {
  try {
    const drinks = await Drink.find({ categoryId: req.params.categoryId });
    res.json(drinks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id',  async (req, res) => {
  try {
    const drink = await Drink.findById(req.params.id);
    if (drink == null) {
      return res.status(404).json({ message: 'Drink not found' });
    }
    res.json(drink);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/',  upload.single('image'), async (req, res) => {
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

router.put('/:id',  upload.single('image'), async (req, res) => {
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

router.delete('/:id',  async (req, res) => {
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

module.exports = router;
