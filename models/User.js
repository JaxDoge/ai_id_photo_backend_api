import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: function () {
        return !this.isGoogleUser;
      },
    },
    lastName: {
      type: String,
      required: function () {
        return !this.isGoogleUser;
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: function () {
        return !this.isGoogleUser;
      },
    },
    isGoogleUser: {
      type: Boolean,
      default: false, // Flag to identify Google sign-in users
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      default: "Other",
    },
    country: {
      type: String,
      default: "Unknown",
    },
    avatar: {
      type: String, // URL or path to the avatar image
      default: null,
    },
    historyPhotos: {
      type: [
        {
          url: String, // URL or path to the photo
          createdAt: { type: Date, default: Date.now }, // Timestamp for each photo entry
        },
      ],
      default: [],
    },
    resetToken: { type: String },
    resetTokenExpiration: { type: Date },
    twoFactorCode: { type: String },
    twoFactorExpiration: { type: Date },
  },
  { timestamps: true }
);

export default model("User", userSchema);
