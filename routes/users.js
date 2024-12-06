import express from "express";
import User from "../models/User.js";
import { OAuth2Client } from "google-auth-library";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../middleware/authMiddleware.js";
import multer from "multer";
import nodemailer from "nodemailer";
import { generatePasswordResetEmail } from "../utils/emailTemplate.js";
import { generateTwoFactorEmail } from "../utils/2FAEmail.js";

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

// login a user, check user and send 2FA code
router.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Trigger 2FA by sending the code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.twoFactorCode = code;
    user.twoFactorExpiration = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Send the code via email
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      to: email,
      from: process.env.EMAIL,
      subject: "Your Authentication Code",
      html: generateTwoFactorEmail(code),
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      message: "2FA code sent successfully!"
    });
  } catch (error) {
    console.error("Error during sign-in:", error);
    res.status(500).json({ error: "Internal server error" });
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
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    return res.status(200).json({ success: true, data: user.historyPhotos });
  } catch (error) {
    console.error("Error fetching photo history:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch photo history" });
  }
});

// Get a single photo by ID
router.get("/get-single-photo", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user.userId });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const photo = user.historyPhotos.find(
      (photo) => photo._id.toString() === req.query.photoId
    );
    if (!photo) {
      return res
        .status(404)
        .json({ success: false, message: "Photo not found" });
    }
    return res.status(200).json({ success: true, data: photo });
  } catch (error) {
    console.error("Error fetching photo:", error);
    res.status(500).json({ success: false, message: "Failed to fetch photo" });
  }
});

// Update user details
router.put("/update", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const updates = req.body;

    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true,
    });

    if (!updatedUser) {
      return res
        .status(404)
        .send({ success: false, message: "User not found" });
    }

    res.send({ success: true, data: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).send({ success: false, message: "Error updating user" });
  }
});

// Forgot password
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ error: "User with this email does not exist" });
    }

    // Generate a password reset token
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Update user record with reset token
    user.resetToken = resetToken;
    user.resetTokenExpiration = Date.now() + 3600000; // 1 hour in milliseconds
    await user.save();

    // Send the reset link via email
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const resetLink = `${process.env.CLIENT_URL}/resetPassword?token=${resetToken}`;

    const mailOptions = {
      to: email,
      from: process.env.EMAIL,
      subject: "Password Reset Request From AI ID PHOTO Generator",
      html: generatePasswordResetEmail(resetLink),
    };

    // const mailOptions = {
    //   from: process.env.EMAIL,
    //   to: "recipient@example.com",
    //   subject: "Test Email",
    //   html: "<p>This is a test email.</p>",
    // };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("Error sending email:", err);
      } else {
        console.log("Email sent successfully:", info.response);
      }
    });

    res.status(200).json({ message: "Password reset email sent successfully" });
  } catch (error) {
    console.error("Error in forgot password:", error);
    if (error.response) {
      console.error("Error response:", error.response);
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Reset passowrd
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user based on the token
    const user = await User.findOne({
      _id: decoded.id,
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    // Update the user's password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    // Clear the resetToken and expiration to prevent reuse
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error in reset password:", error);
    res.status(400).json({ error: "Invalid or expired token" });
  }
});

// Verify 2FA code, this step creates jwt token now
router.post("/verify-2fa-code", async (req, res) => {
  const { email, code } = req.body;

  try {
    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Validate the 2FA code and expiration
    if (user.twoFactorCode !== code || user.twoFactorExpiration < Date.now()) {
      return res
        .status(400)
        .json({ error: "Invalid or expired authentication code." });
    }

    // Generate a JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    // Clear the 2FA code and expiration after successful validation
    user.twoFactorCode = undefined;
    user.twoFactorExpiration = undefined;
    await user.save();

    res
      .status(200)
      .json({
        success: true,
        token,
        userId: user._id,
        message: "2FA verified successfully!",
      });
  } catch (error) {
    console.error("Error verifying 2FA code:", error);
    res.status(500).json({ error: "Failed to verify 2FA code." });
  }
});

export default router;
