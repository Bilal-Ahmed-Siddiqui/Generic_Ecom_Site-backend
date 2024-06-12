const express = require("express");
const router = express.Router();
const Vendor = require("../models/Vendor");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fetchUser = require("../middleware/fetchUser");
require("dotenv").config();
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/ProfilePictures/");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + ".jpeg");
  },
});
const upload = multer({ storage: storage });

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

//sign up POST '/api/vendor/signup'
router.post(
  "/signup",
  [
    body("username", "Username must be at least 5 characters long").isLength({
      min: 5,
    }),
    body("email", "Enter a valid email").isEmail(),
    body("password", "Password must be at least 5 characters long").isLength({
      min: 5,
    }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (errors.isEmpty()) {
        const { username, email, password } = req.body;

        // Check if email already exists
        const existingUser = await Vendor.findOne({ email });
        if (existingUser) {
          return res
            .status(400)
            .json({ success: false, error: "Email already exists" });
        }

        // Hashing password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // User creation
        const newVendor = new Vendor({
          username,
          email,
          password: hashedPassword,
        });
        await newVendor.save();

        // Token generation
        const UID = { user: { id: newVendor.id } };
        const authToken = jwt.sign(UID, JWT_SECRET_KEY);

        return res.json({ success: true, authToken });
      } else {
        return res.status(400).json({ success: false, error: errors.array() });
      }
    } catch (error) {
      console.error(error.message);
      return res
        .status(500)
        .json({ success: false, error: "Internal Server Error!" });
    }
  }
);

//sign in POST '/api/vendor/login'
router.post(
  "/login",
  body("email", "enter a valid email").isEmail(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (errors.isEmpty()) {
        const { email, password } = req.body;
        try {
          let vendor = await Vendor.findOne({ email });
          if (!vendor) {
            return res
              .status(400)
              .json({ success: false, error: "Wrong email or password" });
          }
          const passCheck = await bcrypt.compare(password, vendor.password);
          if (!passCheck) {
            return res
              .status(400)
              .json({ success: false, error: "Wrong email or password" });
          }
          const UID = {
            user: {
              id: vendor.id,
            },
          };
          const authtoken = jwt.sign(UID, JWT_SECRET_KEY);
          res.json({ success: true, authtoken });
        } catch (error) {
          return res.json({ error: error.message });
        }
      } else {
        return res.status(400).json({ success: false, error: errors.array() });
      }
    } catch (error) {
      console.error(error.message);
      return res
        .status(500)
        .json({ success: false, error: "Internal Server Error!" });
    }
  }
);

//fetch user data GET '/api/vendor/getvendor'
router.get("/getvendor", fetchUser, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.user.id).select("-password");
    if (!vendor) {
      return res
        .status(404)
        .json({ success: false, error: "vendor Not Found!" });
    }
    if (vendor.profilePicture.data) {
      vendor.profilePicture.data =
        vendor.profilePicture.data.toString("base64");
    }
    return res.send({ success: true, vendor });
  } catch (error) {
    console.error(error.message);
    return res
      .status(500)
      .json({ success: false, error: "Internal Server Error!" });
  }
});

//Update User Data PUT '/api/vendor/updatevendor'
router.put(
  "/updatevendor",
  fetchUser,
  body("username", "Username must be at least 5 characters long").isLength({
    min: 5,
  }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors });
      }
      let vendor = await Vendor.findById(req.user.id);
      if (!vendor) {
        return res
          .status(404)
          .json({ success: false, error: "vendor Not Found!" });
      }
      const updateFields = ["username", "gender", "phoneNumber"];
      const locationFields = [
        "country",
        "state",
        "city",
        "zipCode",
        "streetAddress",
      ];
      const updatedVendor = {};

      updateFields.forEach((field) => {
        if (req.body[field]) {
          updatedVendor[field] = req.body[field];
        }
      });

      if (req.body.location) {
        updatedVendor.location = {};
        locationFields.forEach((field) => {
          if (req.body.location[field]) {
            updatedVendor.location[field] = req.body.location[field];
          }
        });
      }
      await Vendor.findByIdAndUpdate(
        req.user.id,
        { $set: updatedVendor },
        { new: true }
      );

      res.json({ success: true, message: "User Info updated" });
    } catch (error) {
      console.error(error.message);
      return res
        .status(500)
        .json({ success: false, error: "Internal Server Error!" });
    }
  }
);

//Update pfp  PUT '/api/vendor/updatepicture'
router.put(
  "/updatepicture",
  fetchUser,
  upload.single("ProfilePicture"),

  async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, error: "No valid file uploaded." });
      }
      let profilePicture = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      };
      let vendor = await Vendor.findById(req.user.id);
      if (!vendor) {
        return res
          .status(404)
          .json({ success: false, error: "vendor Not Found!" });
      }
      await Vendor.findByIdAndUpdate(
        req.user.id,
        { $set: { profilePicture: profilePicture } },
        { new: true }
      );

      res.json({ success: true, message: "Profile picture updated" });
    } catch (error) {
      console.error(error.message);
      return res
        .status(500)
        .json({ success: false, error: "Internal Server Error!" });
    }
  }
);

//Update password  PUT '/api/vendor/updatepassword'
router.put(
  "/updatepassword",
  fetchUser,
  [
    body(
      "newPassword",
      "New password must be at least 5 characters long"
    ).isLength({
      min: 5,
    }),
    body("oldPassword", "Old password is required").exists(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors });
      }
      const { oldPassword, newPassword } = req.body;
      let vendor = await Vendor.findById(req.user.id);
      if (!vendor) {
        return res
          .status(404)
          .json({ success: false, error: "vendor Not Found!" });
      }
      const passCheck = await bcrypt.compare(oldPassword, vendor.password);
      if (!passCheck) {
        return res
          .status(400)
          .json({ success: false, error: "Wrong old password" });
      }
      // Hashing password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      await Vendor.findByIdAndUpdate(
        req.user.id,
        { $set: { password: hashedPassword } },
        { new: true }
      );
      res.json({ success: true, message: "Password updated" });
    } catch (error) {
      console.error(error.message);
      return res
        .status(500)
        .json({ success: false, error: "Internal Server Error!" });
    }
  }
);

module.exports = router;
