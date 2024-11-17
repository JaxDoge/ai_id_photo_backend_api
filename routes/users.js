import express from "express";
import User from "../models/User.js";
import { OAuth2Client } from "google-auth-library";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { uploadToS3 } from '../utils/s3Upload.js';
import multer from "multer";

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const upload = multer();


// register a new user
router.post("/signup", async (req, res) => {
  try {
    // check if user already exists
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      return res.send({
        success: false,
        message: "Email already exists",
      });
    }

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    req.body.password = hashedPassword;

    // create new user
    const newUser = new User(req.body);
    await newUser.save();
    return res.send({
      success: true,
      message: "User created successfully , please login",
    });
  } catch (error) {
    return res.send({
      success: false,
      message: error.message,
    });
  }
});

// login a user
router.post("/signin", async (req, res) => {
  try {
    // check if user exists
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.send({
        success: false,
        message: "User does not exist",
      });
    }

    // check if password is correct
    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );

    if (!validPassword) {
      return res.send({
        success: false,
        message: "Invalid password",
      });
    }

    // create and assign a token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    return res.send({
      success: true,
      message: "Login successful",
      data: token,
      user_id: user._id,
    });
  } catch (error) {
    return res.send({
      success: false,
      message: error.message,
    });
  }
});

// get logged in user details
router.get("/get-logged-in-user", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.send({
        success: false,
        message: "User does not exist",
      });
    }
    return res.send({
      success: true,
      message: "User details fetched successfully",
      data: user,
    });
  } catch (error) {
    return res.send({
      success: false,
      message: error.message,
    });
  }
});

// google sign in
router.post("/google-signin", async (req, res) => {
  const { idToken } = req.body;

  try {
    // Verify Google ID token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;

    // Check if user already exists in the database
    let user = await User.findOne({ email });
    if (!user) {
      // If user does not exist, create a new user
      user = new User({
        googleId,
        email,
        firstName: name ? name.split(" ")[0] : "", // Set first name from Google name
        lastName: name ? name.split(" ")[1] : "", // Set last name from Google name
        isGoogleUser: true,
      });
      await user
        .save()
        .then(() => console.log("New Google user saved to database."))
        .catch((error) =>
          console.error("Error saving new Google user:", error)
        );
    } else {
      console.log("Existing user found in database.");
    }

    // Generate JWT token for our backend
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(200).json({ success: true, token, userId: user._id });
  } catch (error) {
    console.error("Google sign-in error:", error);
    res
      .status(500)
      .json({ success: false, message: "Google sign-in failed", error });
  }
});

// TESTING USE: Generate a JWT token for a user
// router.post("/generate-token", (req, res) => {
//   console.log("Received request on /generate-token"); // Log the request
//   const { userId } = req.body;

//   if (!userId) {
//     return res.status(400).json({ success: false, message: "User ID is required" });
//   }

//   const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "1d" });
//   res.json({ success: true, token });
// });


// Get user's photo history
router.get("/get-photo-history", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(200).json({ success: true, data: user.historyPhotos });
  } catch (error) {
    console.error("Error fetching photo history:", error);
    res.status(500).json({ success: false, message: "Failed to fetch photo history" });
  }
});

// Get a single photo by ID
router.get("/get-single-photo", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user.userId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const photo = user.historyPhotos.find(
      (photo) => photo._id.toString() === req.query.photoId
    );
    if (!photo) {
      return res.status(404).json({ success: false, message: "Photo not found" });
    }
    return res.status(200).json({ success: true, data: photo });
  } catch (error) {
    console.error("Error fetching photo:", error);
    res.status(500).json({ success: false, message: "Failed to fetch photo" });
  }
});


export default router;
