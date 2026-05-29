const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const BCRYPT_ROUNDS = 12;

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required."],
      minlength: [3, "Username must be at least 3 characters."],
      maxlength: [30, "Username must be at most 30 characters."],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
      select: false,
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
      select: false,
    },
    image: {
      // FIX #8 — Removed external CDN default; set your own hosted default
      // e.g. "/assets/default-avatar.png" or an S3 URL you control.
      type: String,
      default: "/assets/default-avatar.png",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },

    // FIX #5 — select: false so OTP fields never leak in normal queries.
    verificationOTP: {
      type: String,
      select: false,
    },
    otpExpiresAt: {
      type: Date,
      select: false,
    },
    otpSentAt: {
      type: Date,
      select: false,
    },

    // FIX #2 — Fields required by the login refactor for account lockout.
    failedLoginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    lockedUntil: {
      type: Date,
      default: null,
      select: false,
    },

    // FIX #2 — Supports server-side refresh token revocation.
    refreshJti: {
      type: String,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      // FIX #9 — Strip _id and __v from responses; use the virtual `id` only.
      transform(_, ret) {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// FIX #7 — Removed redundant compound index { email: 1, googleId: 1 }.
// email has its own index; googleId has a sparse unique index. No query
// benefits from the compound, so it was just adding write overhead.
UserSchema.index({ createdAt: -1 });

// FIX #1 — Pre-save hook is now the single place passwords are hashed.
// Remove bcrypt.hash() calls from register.js and login.js; pass plaintext
// and let the hook handle it. The fragile isAlreadyHashed check is gone.
// FIX #3 — Standardised on BCRYPT_ROUNDS (12) everywhere.
// FIX #10 — Explicit next parameter for compatibility.
UserSchema.pre("save", async function () {
  if (this.googleId === "") {
    this.googleId = undefined;
  }

  if (!this.isModified("password") || !this.password) {
    return 
  }

  this.password = await bcrypt.hash(this.password, BCRYPT_ROUNDS);
  
});

module.exports = mongoose.model("User", UserSchema);
