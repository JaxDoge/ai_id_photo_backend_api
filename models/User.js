import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
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
      default: "/images/avatar-default.png",
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
  },
  { timestamps: true }
);

export default model("User", userSchema);
