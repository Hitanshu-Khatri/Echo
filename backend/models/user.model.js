import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    token: { type: String },
    history: [
        {
            meetingCode: { type: String },
            date: { type: Date, default: Date.now }
        }
    ]
});

const User = mongoose.model("User", userSchema);

export  default User ;
