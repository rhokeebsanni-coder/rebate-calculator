const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required."],
      minlength: [3, "Username must be at least 3 characters."],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Invalid email format.",
      ],
    },
    password: {
      type: String,
      required: [
        function () {
          return !this.googleId;
        },
        "Password is required for local accounts.",
      ],
      select: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    image: {
      type: String,
      default: "https://cdn-icons-png.flaticon.com/512/847/847969.png",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationOTP: {
      type: String,
    },
    otpExpiresAt: {
      type: Date,
    },
    otpSentAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

UserSchema.index({ email: 1, googleId: 1 });
UserSchema.index({ createdAt: -1 });

UserSchema.pre("save", async function () {
  if (this.googleId === "") {
    this.googleId = undefined;
  }

  if (!this.isModified("password") || !this.password) {
    return;
  }

  // Password is already hashed in register.js and login.js — skip double hashing
  const isAlreadyHashed =
    this.password.startsWith("$2b$") || this.password.startsWith("$2a$");
  if (isAlreadyHashed) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model("User", UserSchema);
