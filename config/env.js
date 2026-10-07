/**
 * Loads .env before anything else can read process.env.
 *
 * ES module imports are hoisted and evaluated before the importing module's
 * own body, so calling dotenv.config() inside server.js ran *after* app.js had
 * already been evaluated. Any variable read at module scope — the CORS origin
 * allowlist in app.js, for one — saw undefined.
 *
 * Importing this file first makes the load order explicit: it is a module, so
 * it is evaluated in import order, ahead of every import that follows it.
 */
import dotenv from "dotenv";

dotenv.config();

export const env = process.env;
