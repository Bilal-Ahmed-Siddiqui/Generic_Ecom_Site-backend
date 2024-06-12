const mongoose = require("mongoose");
require('dotenv').config();

const mongoURI =  process.env.DB_HOST || "mongodb://localhost:27017/Generic_Ecom_Site";

const connectToMongo = async () => {
  await mongoose.connect(mongoURI);
  console.log("Db connection successful");
};

module.exports = connectToMongo;