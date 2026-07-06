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

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const quotationNumberCandidates = (value) => {
  const normalized = String(value || "").trim().toUpperCase();
  const candidates = [normalized];
  const match = normalized.match(/^(CE)-(\d{4})-(\d+)$/);

  if (match) {
    const [, prefix, year, sequence] = match;
    const numericSequence = String(Number(sequence));

    if (numericSequence !== "NaN") {
      candidates.push(`${prefix}-${year}-${numericSequence.padStart(4, "0")}`);
      candidates.push(`${prefix}-${year}-${numericSequence.padStart(3, "0")}`);
      candidates.push(`${prefix}-${year}-${numericSequence}`);
    }
  }

  return [...new Set(candidates.filter(Boolean))];
};

const quotationNumberQuery = (value) => ({
  $or: quotationNumberCandidates(value).map((candidate) => ({
    quotationNumber: new RegExp(`^${escapeRegex(candidate)}$`, "i")
  }))
});

export const generateQuotationPDF = async (req, res) => {
  try {
    const {
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

    const finalQuotationNumber = quotationNumber || await generateQuotationNumber();
    const safeClientName = clientName.replace(/[^\w\s-]/g, "").replace(/\s+/g, "_");
    const safeEventType = eventType ? eventType.replace(/\s+/g, "_") : "Event";
    const fileName = `${finalQuotationNumber}_${safeClientName}_${safeEventType}_Quotation.pdf`;

    const doc = new PDFDocument({
      size: "A4",
      margin: 30,
      info: {
        Title: `Quotation ${finalQuotationNumber}`,
        Author: "Chinmayi Events",
        Subject: "Event decoration quotation"
      }
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    doc.pipe(res);

    const regularFont = fs.existsSync(fontRegular) ? fontRegular : "Helvetica";
    const boldFont = fs.existsSync(fontBold) ? fontBold : "Helvetica-Bold";
    const logoPath = path.join(__dirname, "../assets/logo.png");

    const colors = {
      maroon: "#5b1730",
      deepMaroon: "#24080f",
      gold: "#d4af37",
      goldSoft: "#f7edd1",
      ink: "#242124",
      muted: "#6d6570",
      line: "#eadfca",
      paper: "#fffaf1",
      white: "#ffffff"
    };

    const page = {
      left: 30,
      right: 565,
      width: 535,
      footerY: 775
    };

    const numberValue = (value) => Number(value || 0);
    const formatMoney = (value) =>
      `Rs. ${numberValue(value).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;
    const display = (value, fallback = "-") => {
      if (value === undefined || value === null || value === "") return fallback;
      return String(value);
    };
    const formatDate = (value) => {
      if (!value) return "-";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return String(value);
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    };
    const titleCase = (value) =>
      display(value)
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());

    const setFont = (isBold = false) => {
      doc.font(isBold ? boldFont : regularFont);
      return doc;
    };

    const drawFooter = () => {
      const pageHeight = doc.page.height;
      doc
        .strokeColor(colors.gold)
        .lineWidth(1.1)
        .moveTo(page.left, pageHeight - 64)
        .lineTo(page.right, pageHeight - 64)
        .stroke();

      setFont(true)
        .fontSize(8.5)
        .fillColor(colors.maroon)
        .text("Chinmayi Events", page.left, pageHeight - 52, {
          width: page.width,
          align: "center"
        });

      setFont()
        .fontSize(7.8)
        .fillColor(colors.muted)
        .text(
          "Kempanahalli, Chikkamagaluru | +91 93803 50678 | chinmayievents99@gmail.com",
          page.left,
          pageHeight - 38,
          { width: page.width, align: "center" }
        );
    };

    const drawHeader = () => {
      doc.rect(0, 0, doc.page.width, 118).fill(colors.deepMaroon);
      doc.rect(0, 113, doc.page.width, 5).fill(colors.gold);

      if (fs.existsSync(logoPath)) {
        doc.save();
        doc.circle(72, 57, 31).clip();
        doc.image(logoPath, 41, 26, { width: 62, height: 62 });
        doc.restore();
      } else {
        doc.circle(72, 57, 31).fill(colors.goldSoft);
        setFont(true).fontSize(18).fillColor(colors.maroon).text("CE", 58, 46);
      }

      setFont(true)
        .fontSize(22)
        .fillColor(colors.white)
        .text("Chinmayi Events", 120, 30, { width: 260 });

      setFont()
        .fontSize(9.5)
        .fillColor("#f4dfae")
        .text("Event Planner & Decoration", 121, 58, { width: 260 })
        .text("Chikkamagaluru, Karnataka", 121, 74, { width: 260 });

      doc.roundedRect(415, 27, 122, 58, 7).strokeColor(colors.gold).lineWidth(1).stroke();
      setFont(true)
        .fontSize(13)
        .fillColor(colors.gold)
        .text("QUOTATION", 428, 39, { width: 96, align: "center" });
      setFont()
        .fontSize(8)
        .fillColor(colors.white)
        .text(finalQuotationNumber, 428, 59, { width: 96, align: "center" });
    };

    const drawPanel = (x, y, width, height, title) => {
      doc.roundedRect(x, y, width, height, 7).fill(colors.paper);
      doc.roundedRect(x, y, width, height, 7).strokeColor(colors.line).lineWidth(0.8).stroke();
      setFont(true).fontSize(8).fillColor(colors.gold).text(title.toUpperCase(), x + 14, y + 13);
    };

    const drawInfoPanels = (startY) => {
      drawPanel(30, startY, 258, 112, "Bill To");
      setFont(true).fontSize(12.5).fillColor(colors.ink).text(display(clientName), 44, startY + 32, { width: 225 });
      setFont().fontSize(8.7).fillColor(colors.muted);
      doc.text(`Phone: ${display(clientPhone)}`, 44, startY + 53, { width: 220 });
      doc.text(`Email: ${display(clientEmail)}`, 44, startY + 68, { width: 220 });
      doc.text(`Event Type: ${titleCase(eventType)}`, 44, startY + 83, { width: 220 });

      drawPanel(307, startY, 258, 112, "Quotation Details");
      setFont().fontSize(9).fillColor(colors.muted);
      doc.text("Quotation No.", 321, startY + 34, { width: 88 });
      doc.text("Quotation Date", 321, startY + 55, { width: 88 });
      doc.text("Event Date", 321, startY + 76, { width: 88 });

      setFont(true).fontSize(9.2).fillColor(colors.ink);
      doc.text(finalQuotationNumber, 430, startY + 34, { width: 116, align: "right" });
      doc.text(formatDate(quotationDate), 430, startY + 55, { width: 116, align: "right" });
      doc.text(formatDate(eventDate), 430, startY + 76, { width: 116, align: "right" });

      return startY + 136;
    };

    const columns = {
      no: { x: 30, width: 44 },
      item: { x: 74, width: 242 },
      qty: { x: 316, width: 58 },
      rate: { x: 374, width: 88 },
      amount: { x: 462, width: 103 }
    };

    const drawTableHeader = (y) => {
      doc.roundedRect(page.left, y, page.width, 28, 5).fill(colors.maroon);
      setFont(true).fontSize(8.5).fillColor(colors.white);
      doc.text("Sl No", columns.no.x + 8, y + 9, { width: columns.no.width - 12, align: "center" });
      doc.text("Item Description", columns.item.x + 10, y + 9, { width: columns.item.width - 16 });
      doc.text("Qty", columns.qty.x + 8, y + 9, { width: columns.qty.width - 12, align: "center" });
      doc.text("Rate", columns.rate.x + 8, y + 9, { width: columns.rate.width - 14, align: "right" });
      doc.text("Amount", columns.amount.x + 8, y + 9, { width: columns.amount.width - 14, align: "right" });
      return y + 28;
    };

    const ensureSpace = (y, neededHeight) => {
      if (y + neededHeight <= page.footerY) return y;
      drawFooter();
      doc.addPage();
      return drawTableHeader(54);
    };

    drawHeader();
    let currentY = drawInfoPanels(143);
    currentY = drawTableHeader(currentY);

    const normalizedItems = items.map((item) => ({
      material: display(item.material, "Event decoration item"),
      quantity: numberValue(item.quantity),
      amount: numberValue(item.amount)
    }));

    normalizedItems.forEach((item, index) => {
      setFont().fontSize(8.8);
      const textHeight = doc.heightOfString(item.material, {
        width: columns.item.width - 18
      });
      const rowHeight = Math.max(34, textHeight + 18);
      currentY = ensureSpace(currentY, rowHeight);

      if (index % 2 === 0) {
        doc.rect(page.left, currentY, page.width, rowHeight).fill("#fffdf8");
      }

      doc.strokeColor(colors.line).lineWidth(0.5);
      doc.moveTo(page.left, currentY + rowHeight).lineTo(page.right, currentY + rowHeight).stroke();

      setFont().fontSize(8.9).fillColor(colors.ink);
      doc.text(String(index + 1), columns.no.x + 8, currentY + 11, {
        width: columns.no.width - 12,
        align: "center"
      });
      doc.text(item.material, columns.item.x + 10, currentY + 10, {
        width: columns.item.width - 18
      });
      doc.text(String(item.quantity), columns.qty.x + 8, currentY + 11, {
        width: columns.qty.width - 12,
        align: "center"
      });
      doc.text(formatMoney(item.amount), columns.rate.x + 8, currentY + 11, {
        width: columns.rate.width - 14,
        align: "right"
      });
      doc.text(formatMoney(item.quantity * item.amount), columns.amount.x + 8, currentY + 11, {
        width: columns.amount.width - 14,
        align: "right"
      });

      currentY += rowHeight;
    });

    currentY = ensureSpace(currentY + 18, 150);

    const itemsTotal = numberValue(total);
    const transport = numberValue(transportationCharge);
    const grandTotal = itemsTotal + transport;

    doc.roundedRect(30, currentY, 300, 112, 7).fill(colors.paper);
    doc.roundedRect(30, currentY, 300, 112, 7).strokeColor(colors.line).lineWidth(0.8).stroke();
    setFont(true).fontSize(8).fillColor(colors.gold).text("NOTES", 45, currentY + 15);
    setFont().fontSize(8.5).fillColor(colors.muted).text(
      "This quotation is valid for 7 days. Final pricing may vary based on venue access, selected materials, event timing and confirmed requirements.",
      45,
      currentY + 34,
      { width: 268, lineGap: 3 }
    );
    setFont(true).fontSize(9).fillColor(colors.maroon).text(
      "Thank you for choosing Chinmayi Events.",
      45,
      currentY + 86,
      { width: 268 }
    );

    doc.roundedRect(350, currentY, 215, 112, 7).fill("#ffffff");
    doc.roundedRect(350, currentY, 215, 112, 7).strokeColor(colors.line).lineWidth(0.8).stroke();

    setFont().fontSize(9).fillColor(colors.muted);
    doc.text("Items Total", 366, currentY + 18, { width: 80 });
    doc.text("Transportation", 366, currentY + 40, { width: 90 });
    setFont(true).fontSize(9.5).fillColor(colors.ink);
    doc.text(formatMoney(itemsTotal), 452, currentY + 18, { width: 96, align: "right" });
    doc.text(formatMoney(transport), 452, currentY + 40, { width: 96, align: "right" });

    doc.rect(350, currentY + 72, 215, 40).fill(colors.maroon);
    setFont(true).fontSize(10).fillColor(colors.white).text("Grand Total", 366, currentY + 86, { width: 85 });
    setFont(true).fontSize(12).fillColor(colors.gold).text(formatMoney(grandTotal), 442, currentY + 84, {
      width: 106,
      align: "right"
    });

    drawFooter();
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
    
    const quotation = await Quotation.findOne(quotationNumberQuery(quotationNumber));

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

    console.log("Updating quotation:", quotationNumber);

    const quotation = await Quotation.findOneAndUpdate(
      quotationNumberQuery(quotationNumber),
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
      console.log("Quotation not found for update:", quotationNumber);
      return res.status(404).json({ error: "Quotation not found" });
    }

    console.log("Quotation updated successfully:", quotationNumber);

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

