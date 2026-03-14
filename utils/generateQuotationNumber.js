import Counter from "../models/counter.model.js";

export const generateQuotationNumber = async () => {
  const year = new Date().getFullYear();

  const counter = await Counter.findOneAndUpdate(
    { name: "quotation", year: year },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true }
  );

  const number = String(counter.sequence).padStart(4, "0");

  return `CE-${year}-${number}`;
};