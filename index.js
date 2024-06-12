const connectToMongo = require("./db");
const express = require("express");
var cors = require("cors");
require('dotenv').config();

connectToMongo();
const app = express();
const port = process.env.PORT || 8000;

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Generic Ecom Site");
});

//routes
app.use("/api/user", require("./routes/user"));
app.use("/api/vendor", require("./routes/vendor"));


app.listen(port, () => {
  console.log(`Generic_Ecom_Site listening on http://localhost:${port}`);
});