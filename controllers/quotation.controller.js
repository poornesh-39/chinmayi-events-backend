import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { generateQuotationNumber } from "../utils/generateQuotationNumber.js";
import Quotation from "../models/Quotation.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fonts
const fontBold = path.join(__dirname, "../assets/fonts/NotoSans-Bold.ttf");
const fontRegular = path.join(__dirname, "../assets/fonts/NotoSans-Regular.ttf");

export const generateQuotationPDF = async (req, res) => {
  try {

    const {
      clientName,
      clientEmail,
      clientPhone,
      eventType,
      quotationDate,
      eventDate,
      items,
      total,
      transportationCharge = 0
    } = req.body;

    if (!clientName || !items || items.length === 0) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const quotationNumber = await generateQuotationNumber();

    const safeClientName = clientName.replace(/\s+/g, "_");
    const safeEventType = eventType ? eventType.replace(/\s+/g, "_") : "Event";

    const fileName = `${quotationNumber}_${safeClientName}_${safeEventType}_Quotation.pdf`;

    const doc = new PDFDocument({
      size: "A4",
      margin: 30
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName}"`
    );

    doc.pipe(res);

    let currentY = 20;

    // ================= LOGO =================

    const logoPath = path.join(__dirname, "../assets/logo.png");
    const logoX = 50;
    const logoSize = 70;

    if (fs.existsSync(logoPath)) {

      doc.save();

      doc
        .circle(logoX + logoSize / 2, currentY + logoSize / 2, logoSize / 2)
        .clip();

      doc.image(logoPath, logoX, currentY, {
        width: logoSize,
        height: logoSize
      });

      doc.restore();
    }

    // ================= HEADER =================

    doc
      .font(fontBold)
      .fontSize(20)
      .fillColor("#1a1a2e")
      .text("CHINMAYI EVENTS", 200, currentY + 5, {
        width: 300,
        align: "center"
      });

    doc
      .font(fontRegular)
      .fontSize(10)
      .fillColor("#444")
      .text("Event Planner & Decoration", 200, currentY + 32, {
        width: 300,
        align: "center"
      });

    doc
      .fontSize(9)
      .fillColor("#666")
      .text("Chikkamagaluru, Karnataka", 200, currentY + 46, {
        width: 300,
        align: "center"
      });

    doc.text("Phone: +91 9380350678", 200, currentY + 58, {
      width: 300,
      align: "center"
    });

    doc.text("Email: chinmayievents99@gmail.com", 200, currentY + 70, {
      width: 300,
      align: "center"
    });

    // ================= HEADER LINE =================

    currentY += 95;

    doc
      .strokeColor("#d4af37")
      .lineWidth(1.5)
      .moveTo(30, currentY)
      .lineTo(565, currentY)
      .stroke();

    // ================= QUOTATION INFO =================

    currentY += 15;

    doc
      .font(fontBold)
      .fontSize(11)
      .fillColor("black")
      .text(`Quotation Number: ${quotationNumber}`, 30, currentY);

    doc
      .font(fontRegular)
      .text(`Date: ${quotationDate}`, 420, currentY);

    currentY += 15;

    if (eventDate) {
      doc
        .font(fontBold)
        .fontSize(11)
        .text(`Event Date: ${eventDate}`, 420, currentY);
    }

    // ================= CLIENT DETAILS =================

    currentY += 25;

    doc
      .font(fontBold)
      .fontSize(10)
      .text("Bill To:", 30, currentY);

    currentY += 15;

    doc
      .font(fontRegular)
      .fontSize(9)
      .text(clientName, 30, currentY);

    currentY += 12;

    if (clientEmail) {
      doc.text(`Email: ${clientEmail}`, 30, currentY);
      currentY += 12;
    }

    if (clientPhone) {
      doc.text(`Phone: ${clientPhone}`, 30, currentY);
      currentY += 12;
    }

    if (eventType) {
      doc.text(`Event Type: ${eventType}`, 30, currentY);
      currentY += 12;
    }

    // ================= TABLE =================

    currentY += 20;

    const col0 = 30; // SL
    const col1 = 70; // ITEM
    const col2 = 330; // QTY
    const col3 = 390; // RATE
    const col4 = 470; // AMOUNT

    const rowHeight = 22;

    // Header background
    doc
      .rect(col0, currentY, 520, rowHeight)
      .fillColor("#1a1a2e")
      .fill();

    doc.fillColor("white").font(fontBold).fontSize(9);

    doc.text("Sl No", col0 + 5, currentY + 6, { width: 40, align: "center" });
    doc.text("Item Description", col1 + 5, currentY + 6);
    doc.text("Qty", col2 + 5, currentY + 6, { width: 50, align: "center" });
    doc.text("Rate (₹)", col3 + 5, currentY + 6, { width: 60, align: "right" });
    doc.text("Amount (₹)", col4 + 5, currentY + 6, { width: 70, align: "right" });

    let tableY = currentY + rowHeight;

    doc.font(fontRegular).fontSize(9).fillColor("black");

    items.forEach((item, index) => {

      const amount = item.quantity * item.amount;

      doc.text(index + 1, col0 + 5, tableY + 6, { width: 40, align: "center" });

      doc.text(item.material, col1 + 5, tableY + 6, { width: 240 });

      doc.text(item.quantity.toString(), col2 + 5, tableY + 6, {
        width: 50,
        align: "center"
      });

      doc.text(`${item.amount.toFixed(2)}`, col3 + 5, tableY + 6, {
        width: 60,
        align: "right"
      });

      doc.text(`${amount.toFixed(2)}`, col4 + 5, tableY + 6, {
        width: 70,
        align: "right"
      });

      // horizontal line
      doc
        .strokeColor("#e0e0e0")
        .lineWidth(0.5)
        .moveTo(col0, tableY)
        .lineTo(col4 + 75, tableY)
        .stroke();

      // vertical lines
      doc.moveTo(col0, tableY).lineTo(col0, tableY + rowHeight).stroke();
      doc.moveTo(col1, tableY).lineTo(col1, tableY + rowHeight).stroke();
      doc.moveTo(col2, tableY).lineTo(col2, tableY + rowHeight).stroke();
      doc.moveTo(col3, tableY).lineTo(col3, tableY + rowHeight).stroke();
      doc.moveTo(col4, tableY).lineTo(col4, tableY + rowHeight).stroke();
      doc.moveTo(col4 + 75, tableY).lineTo(col4 + 75, tableY + rowHeight).stroke();

      tableY += rowHeight;

    });

    doc
      .moveTo(col0, tableY)
      .lineTo(col4 + 75, tableY)
      .stroke();

    // ================= TOTALS =================

    const totalsY = tableY + 15;

    const itemsTotal = total;
    const grandTotal = itemsTotal + transportationCharge;

    doc
      .font(fontRegular)
      .fontSize(10);

    doc.text("Items Total:", col3 + 5, totalsY);

    doc.text(`₹${itemsTotal.toFixed(2)}`, col4 + 5, totalsY, {
      width: 70,
      align: "right"
    });

    const transportY = totalsY + 18;

    doc.text("Transportation Charge:", col3 + 5, transportY);

    doc.text(`₹${transportationCharge.toFixed(2)}`, col4 + 5, transportY, {
      width: 70,
      align: "right"
    });

    const grandY = transportY + 22;

    doc
      .font(fontBold)
      .fontSize(12)
      .fillColor("#1a1a2e");

    doc.text("Grand Total:", col3 + 5, grandY);

    doc.text(`₹${grandTotal.toFixed(2)}`, col4 + 5, grandY, {
      width: 70,
      align: "right"
    });

    // ================= FOOTER =================

    const pageHeight = doc.page.height;

    doc
    .strokeColor("#d4af37")
    .lineWidth(1.25)
    .moveTo(30, pageHeight - 70)
    .lineTo(565, pageHeight - 70)
    .stroke();

    doc
    .font(fontRegular)
    .fontSize(9)
    .fillColor("#666666")
    .text(
        "Thank you for choosing Chinmayi Events!",
        30,
        pageHeight - 60,
        { align: "center", width: 535 }
    );

    doc
    .fontSize(8)
    .text(
        "We look forward to making your event memorable.",
        30,
        pageHeight - 45,
        { align: "center", width: 535 }
    );

    doc.end();

  } catch (error) {

    console.error("PDF generation error:", error);

    res.status(500).json({
      error: "Failed to generate PDF",
      details: error.message
    });

  }
};

export const saveQuotation = async (req, res) => {
  try {
    let {
      quotationNumber,
      clientName,
      clientEmail,
      clientPhone,
      eventType,
      quotationDate,
      eventDate,
      items,
      total,
      transportationCharge = 0
    } = req.body;

    if (!clientName || !items || items.length === 0) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Convert eventType to lowercase for enum validation
    if (eventType) {
      eventType = eventType.toLowerCase().trim();
    }

    // Generate quotation number if not provided or empty
    if (!quotationNumber || quotationNumber.trim() === '') {
      quotationNumber = await generateQuotationNumber();
    }

    console.log("Generated/Received Quotation Number:", quotationNumber);

    // Check if quotation already exists
    const existingQuotation = await Quotation.findOne({ quotationNumber });

    if (existingQuotation) {
      // Update existing quotation
      console.log("Updating existing quotation:", quotationNumber);
      const updated = await Quotation.findByIdAndUpdate(
        existingQuotation._id,
        {
          clientName,
          clientEmail,
          clientPhone,
          eventType,
          quotationDate,
          eventDate,
          items,
          total,
          transportationCharge
        },
        { new: true }
      );

      return res.status(200).json({
        message: "Quotation updated successfully",
        quotation: updated
      });
    }

    // Create new quotation
    console.log("Creating new quotation with number:", quotationNumber);
    const quotation = new Quotation({
      quotationNumber,
      clientName,
      clientEmail,
      clientPhone,
      eventType,
      quotationDate,
      eventDate,
      items,
      total,
      transportationCharge
    });

    await quotation.save();
    console.log("Quotation saved successfully:", quotationNumber);

    res.status(201).json({
      message: "Quotation saved successfully",
      quotation
    });
  } catch (error) {
    console.error("Error saving quotation:", error);
    res.status(500).json({
      error: "Failed to save quotation",
      details: error.message
    });
  }
};

export const getQuotationByNumber = async (req, res) => {
  try {
    let { quotationNumber } = req.params;

    if (!quotationNumber) {
      return res.status(400).json({ error: "Quotation number is required" });
    }

    // Trim whitespace and handle case sensitivity
    quotationNumber = quotationNumber.trim();
    
    console.log("Searching for quotation number:", quotationNumber);
    
    const quotation = await Quotation.findOne({ quotationNumber });

    if (!quotation) {
      console.log("Quotation not found for number:", quotationNumber);
      return res.status(404).json({ error: "Quotation not found" });
    }

    console.log("Quotation found:", quotationNumber);
    res.status(200).json({
      message: "Quotation found",
      quotation
    });
  } catch (error) {
    console.error("Error fetching quotation:", error);
    res.status(500).json({
      error: "Failed to fetch quotation",
      details: error.message
    });
  }
};

export const updateQuotation = async (req, res) => {
  try {
    const { quotationNumber } = req.params;
    let {
      clientName,
      clientEmail,
      clientPhone,
      eventType,
      quotationDate,
      eventDate,
      items,
      total,
      transportationCharge = 0
    } = req.body;

    if (!quotationNumber) {
      return res.status(400).json({ error: "Quotation number is required" });
    }

    if (!clientName || !items || items.length === 0) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Convert eventType to lowercase for enum validation
    if (eventType) {
      eventType = eventType.toLowerCase().trim();
    }

    const quotation = await Quotation.findOneAndUpdate(
      { quotationNumber },
      {
        clientName,
        clientEmail,
        clientPhone,
        eventType,
        quotationDate,
        eventDate,
        items,
        total,
        transportationCharge
      },
      { new: true }
    );

    if (!quotation) {
      return res.status(404).json({ error: "Quotation not found" });
    }

    res.status(200).json({
      message: "Quotation updated successfully",
      quotation
    });
  } catch (error) {
    console.error("Error updating quotation:", error);
    res.status(500).json({
      error: "Failed to update quotation",
      details: error.message
    });
  }
};