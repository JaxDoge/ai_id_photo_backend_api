import mongoose, { Schema } from "mongoose";

const photoSchema = new mongoose.Schema ({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    url: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default model("Photo", photoSchema);

