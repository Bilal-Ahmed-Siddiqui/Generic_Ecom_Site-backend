const mongoose = require("mongoose");

const { Schema } = mongoose;

const Userschema = new Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  profilePicture: {
    data: Buffer,
    contentType: String,
  },
  gender: {
    type: String,
  },
  phoneNumber: {
    type: Number,
  },
  location: {
    country: {
      type: String,
    },
    state: {
      type: String,
    },
    city: {
      type: String,
    },
    zipCode: {
      type: Number,
    },
    streetAddress: {
      type: String,
    },
  },
  dateCreated: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("user", Userschema);
