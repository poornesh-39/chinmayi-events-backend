import Admin from "../models/Admin.js";

/**
 * Creates the first admin from environment variables on boot.
 *
 * There is deliberately no public "register" route — an open one on a single
 * tenant app is the same hole as no auth at all. Seeding here means the only
 * way to mint an account is to have access to the deployment's environment.
 *
 * Runs once: if any admin already exists this is a no-op, so changing
 * ADMIN_PASSWORD later will not rotate it. Use resetAdminPassword for that.
 */
export const bootstrapAdmin = async () => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    const count = await Admin.estimatedDocumentCount();
    if (count === 0) {
      console.warn(
        "⚠ No admin account exists and ADMIN_EMAIL / ADMIN_PASSWORD are unset — the admin panel cannot be used."
      );
    }
    return;
  }

  if (password.length < 12) {
    console.warn("⚠ ADMIN_PASSWORD is shorter than 12 characters — use a longer one.");
  }

  const existing = await Admin.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    // Say so out loud. Editing ADMIN_PASSWORD and finding the old one still in
    // force is baffling otherwise — the seed is intentionally one-shot so a
    // redeploy cannot silently reset a password that was changed on purpose.
    console.log(
      `Admin ${existing.email} already exists — ADMIN_PASSWORD is NOT applied to an existing account. ` +
        `To change it, set ADMIN_PASSWORD_RESET=true for one boot, then remove it.`
    );
    return;
  }

  const anyAdmin = await Admin.estimatedDocumentCount();
  if (anyAdmin > 0) {
    console.log("Admin accounts already exist — skipping seed.");
    return;
  }

  const admin = new Admin({ email, name: process.env.ADMIN_NAME || "Administrator" });
  admin.password = password;
  await admin.save();

  console.log(`✓ Seeded admin account: ${admin.email}`);
};

/**
 * Rotates a password from the environment, for when one has been exposed.
 * Guarded so a stray env var on a normal boot cannot silently reset anything.
 */
export const resetAdminPassword = async () => {
  if (process.env.ADMIN_PASSWORD_RESET !== "true") return;

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;

  const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
  if (!admin) return;

  admin.password = password;
  await admin.save();
  console.log(`✓ Reset password for ${admin.email} — unset ADMIN_PASSWORD_RESET now.`);
};
