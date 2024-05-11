const express = require('express');
const cors = require('cors');
const app = express();
const morgan = require('morgan');
const mongoose = require('mongoose');
const path = require("path");

const admin = require("firebase-admin");
const serviceAccount = require("./shoesstore-fc02b-firebase-adminsdk-sfm26-70e11bd8af.json");

const categoryRoutes = require("./routes/categoryRoutes");
const drinkRoutes = require("./routes/drinkRoutes");
const userRoutes = require("./routes/userRoutes");
const billRoutes = require("./routes/billRoutes");
const weekScheduleRoutes = require("./routes/weekScheduleRoutes");
const reportRoutes = require("./routes/reportRoutes");
const historyRoutes = require("./routes/historyRoutes");
const ingredientRoutes = require("./routes/ingredientRoutes");
const transactionIngredientRoutes = require("./routes/transactionIngredientRoutes");
const ingredientExpenseRoutes = require("./routes/ingredientExpenseRoutes");

require('dotenv/config')

const secretKey = process.env.KEY_SECRET;
// Sử dụng middleware cors
app.use(express.json());
app.use(cors());
app.use(morgan('tiny'));


if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.Storage_Bucket
  });
}


mongoose.connect(process.env.Connection_String)
  .then(() => {
    console.log("Database is connecting");
  })
  .catch((err) => {
    console.log(err);
  })

app.use("/api/categories", categoryRoutes);
app.use("/api/drinks", drinkRoutes);
app.use("/api/users", userRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/weekSchedule", weekScheduleRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/ingredient", ingredientRoutes);
app.use("/api/transactionIngredient", transactionIngredientRoutes);
app.use("/api/ingredientExpense", ingredientExpenseRoutes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
