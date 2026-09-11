import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    name: {
      type: String,
      trim: true,
      default: "Administrator"
    },
    lastLoginAt: {
      type: Date
    }
  },
  { timestamps: true }
);

/**
 * Hashes on the way in so no call site ever has to remember to. Plain
 * assignment to `admin.password` is the only supported way to set one — the
 * hash field is never written directly outside this model.
 */
adminSchema.virtual("password").set(function setPassword(value) {
  this.passwordHash = bcrypt.hashSync(value, SALT_ROUNDS);
});

adminSchema.methods.verifyPassword = function verifyPassword(candidate) {
  if (!candidate || !this.passwordHash) return false;
  return bcrypt.compareSync(candidate, this.passwordHash);
};

// The hash must never reach a response body, even by accident.
adminSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model("Admin", adminSchema);
