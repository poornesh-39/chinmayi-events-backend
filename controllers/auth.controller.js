import Admin from "../models/Admin.js";
import { signAdminToken } from "../middleware/auth.js";

/**
 * Deliberately vague on failure: the same message and status whether the email
 * is unknown or the password is wrong, so the endpoint cannot be used to
 * enumerate which addresses are admins.
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const admin = await Admin.findOne({ email: String(email).toLowerCase().trim() });

    if (!admin || !admin.verifyPassword(password)) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    admin.lastLoginAt = new Date();
    await admin.save();

    return res.status(200).json({
      message: "Signed in",
      token: signAdminToken(admin),
      admin: { email: admin.email, name: admin.name }
    });
  } catch (error) {
    console.error("Login failed:", error);
    return res.status(500).json({ message: "Could not sign in" });
  }
};

/** Lets the admin panel confirm a stored token is still good before rendering. */
export const me = async (req, res) => {
  return res.status(200).json({
    admin: { email: req.admin.email, name: req.admin.name }
  });
};
