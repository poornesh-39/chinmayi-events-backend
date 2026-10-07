/**
 * Backfills `status` on enquiries created before the field existed.
 *
 * Mongoose applies the schema default when it hydrates a document, so these
 * rows already *display* as "new" — but the field is absent in MongoDB, so
 * countDocuments({ status: 'new' }) and ?status=new filters skip them. This
 * writes the value so queries agree with what the panel shows.
 *
 * Safe to run repeatedly: it only touches documents missing the field.
 */
import "../config/env.js";
import mongoose from "mongoose";
import Contact from "../models/Contact.js";

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const missing = await Contact.countDocuments({ status: { $exists: false } });
  if (missing === 0) {
    console.log("Nothing to backfill — every enquiry already has a status.");
  } else {
    const result = await Contact.updateMany(
      { status: { $exists: false } },
      { $set: { status: "new" } }
    );
    console.log(`Backfilled status on ${result.modifiedCount} of ${missing} enquiries.`);
  }

  await mongoose.disconnect();
};

run().catch((error) => {
  console.error("Backfill failed:", error);
  process.exit(1);
});
