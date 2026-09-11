import jwt from "jsonwebtoken";

export const TOKEN_TTL = "12h";

const bearerToken = (req) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  return token || null;
};

export const signAdminToken = (admin) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");

  return jwt.sign(
    { sub: String(admin._id), email: admin.email, name: admin.name },
    secret,
    { expiresIn: TOKEN_TTL }
  );
};

/**
 * Gate for every route that changes data or exposes the admin view.
 *
 * Mount this BEFORE multer on upload routes — otherwise an anonymous request
 * buffers its 50 MB into memory before anyone checks whether it was allowed to.
 */
export const requireAuth = (req, res, next) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error("JWT_SECRET is not configured — refusing all admin requests");
    return res.status(500).json({ message: "Server auth is not configured" });
  }

  const token = bearerToken(req);
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    req.admin = jwt.verify(token, secret);
    return next();
  } catch (error) {
    const expired = error.name === "TokenExpiredError";
    return res.status(401).json({
      message: expired ? "Session expired, please sign in again" : "Invalid session"
    });
  }
};
