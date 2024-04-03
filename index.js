const express = require('express');
const cors = require('cors');
const app = express();
const morgan = require('morgan');
const mongoose = require('mongoose');
const categoryRoutes = require("./routes/categoryRoutes");

require('dotenv/config')

// Sử dụng middleware cors
app.use(express.json());
app.use(cors());
app.use(morgan('tiny'));

app.get('/api/data', (req, res) => {
  res.json({ message: 'Welcome to my API!' });
});

// Thiết lập các tùy chọn thời gian chờ cho kết nối MongoDB
const mongooseOptions = {
  serverSelectionTimeoutMS: 10000, // Thiết lập thời gian chờ kết nối MongoDB
};

mongoose.connect(process.env.Connection_String, mongooseOptions)
  .then(() => {
    console.log("Database is connecting");
  })
  .catch((err) => {
    console.log(err);
  })

app.use("/api/categories", categoryRoutes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
