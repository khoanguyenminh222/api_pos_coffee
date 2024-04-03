const express = require('express');
const cors = require('cors');
const app = express();
const morgan = require('morgan');
const mongoose = require('mongoose');
const path = require("path");

const categoryRoutes = require("./routes/categoryRoutes");

require('dotenv/config')

// Sử dụng middleware cors
app.use(express.json());
app.use(cors());
app.use(morgan('tiny'));
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect(process.env.Connection_String)
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
