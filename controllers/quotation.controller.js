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
      bufferPages: true,
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
      footerY: 768
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

    // Footers are drawn once at the end over the buffered pages. The bottom
    // margin is zeroed first, otherwise text this low makes pdfkit add a page.
    const drawFooter = (pageNumber, pageCount) => {
      const pageHeight = doc.page.height;
      doc.page.margins.bottom = 0;

      doc
        .strokeColor(colors.gold)
        .lineWidth(1)
        .moveTo(page.left, pageHeight - 56)
        .lineTo(page.right, pageHeight - 56)
        .stroke();

      setFont(true)
        .fontSize(8.5)
        .fillColor(colors.maroon)
        .text("Chinmayi Events", page.left, pageHeight - 47, {
          width: page.width,
          align: "center",
          lineBreak: false
        });

      setFont()
        .fontSize(7.8)
        .fillColor(colors.muted)
        .text(
          "Kempanahalli, Chikkamagaluru  |  +91 93803 50678  |  chinmayievents99@gmail.com",
          page.left,
          pageHeight - 34,
          { width: page.width, align: "center", lineBreak: false }
        );

      if (pageCount > 1) {
        doc.text(`Page ${pageNumber} of ${pageCount}`, page.left, pageHeight - 47, {
          width: page.width,
          align: "right",
          lineBreak: false
        });
      }
    };

    const drawHeader = () => {
      doc.rect(0, 0, doc.page.width, 100).fill(colors.deepMaroon);
      doc.rect(0, 100, doc.page.width, 3).fill(colors.gold);

      if (fs.existsSync(logoPath)) {
        doc.save();
        doc.circle(60, 50, 28).clip();
        doc.image(logoPath, 32, 22, { width: 56, height: 56 });
        doc.restore();
      } else {
        doc.circle(60, 50, 28).fill(colors.goldSoft);
        setFont(true).fontSize(17).fillColor(colors.maroon).text("CE", 32, 39, { width: 56, align: "center" });
      }

      setFont(true)
        .fontSize(20)
        .fillColor(colors.white)
        .text("Chinmayi Events", 102, 25, { width: 280 });

      setFont()
        .fontSize(9)
        .fillColor("#f4dfae")
        .text("Event Planner & Decoration  |  Chikkamagaluru, Karnataka", 103, 55, { width: 300 });

      setFont(true)
        .fontSize(17)
        .fillColor(colors.gold)
        .text("QUOTATION", 395, 28, { width: 170, align: "right", characterSpacing: 1.5 });
      setFont()
        .fontSize(9)
        .fillColor(colors.white)
        .text(finalQuotationNumber, 395, 55, { width: 170, align: "right" });
    };

    const drawPanel = (x, y, width, height, title) => {
      doc.roundedRect(x, y, width, height, 6).fill(colors.paper);
      doc.roundedRect(x, y, width, height, 6).strokeColor(colors.line).lineWidth(0.8).stroke();
      setFont(true)
        .fontSize(7.5)
        .fillColor(colors.maroon)
        .text(title.toUpperCase(), x + 14, y + 12, { characterSpacing: 0.8 });
    };

    const drawInfoPanels = (startY) => {
      const panelHeight = 92;

      drawPanel(30, startY, 258, panelHeight, "Bill To");
      setFont(true).fontSize(12).fillColor(colors.ink).text(display(clientName), 44, startY + 27, {
        width: 230,
        height: 16,
        ellipsis: true
      });

      const clientLines = [
        clientPhone && `Phone: ${clientPhone}`,
        clientEmail && `Email: ${clientEmail}`,
        eventType && `Event: ${titleCase(eventType)}`
      ].filter(Boolean);

      setFont().fontSize(8.7).fillColor(colors.muted);
      clientLines.forEach((line, index) => {
        doc.text(line, 44, startY + 47 + index * 13, { width: 230, height: 12, ellipsis: true });
      });

      drawPanel(307, startY, 258, panelHeight, "Quotation Details");
      const details = [
        ["Quotation No.", finalQuotationNumber],
        ["Quotation Date", formatDate(quotationDate)],
        ["Event Date", formatDate(eventDate)]
      ];

      details.forEach(([label, value], index) => {
        const rowY = startY + 30 + index * 18;
        setFont().fontSize(8.7).fillColor(colors.muted).text(label, 321, rowY, { width: 100 });
        setFont(true).fontSize(9).fillColor(colors.ink).text(value, 421, rowY, { width: 130, align: "right" });
      });

      return startY + panelHeight + 18;
    };

    const columns = {
      no: { x: 30, width: 44 },
      item: { x: 74, width: 242 },
      qty: { x: 316, width: 58 },
      rate: { x: 374, width: 88 },
      amount: { x: 462, width: 103 }
    };

    const drawTableHeader = (y) => {
      doc.roundedRect(page.left, y, page.width, 24, 4).fill(colors.maroon);
      setFont(true).fontSize(8.3).fillColor(colors.white);
      doc.text("Sl No", columns.no.x + 8, y + 7, { width: columns.no.width - 12, align: "center" });
      doc.text("Item Description", columns.item.x + 10, y + 7, { width: columns.item.width - 16 });
      doc.text("Qty", columns.qty.x + 8, y + 7, { width: columns.qty.width - 12, align: "center" });
      doc.text("Rate", columns.rate.x + 8, y + 7, { width: columns.rate.width - 14, align: "right" });
      doc.text("Amount", columns.amount.x + 8, y + 7, { width: columns.amount.width - 14, align: "right" });
      return y + 24;
    };

    const ensureSpace = (y, neededHeight, repeatTableHeader = true) => {
      if (y + neededHeight <= page.footerY) return y;
      doc.addPage();
      return repeatTableHeader ? drawTableHeader(40) : 40;
    };

    drawHeader();
    let currentY = drawInfoPanels(121);
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
      const rowHeight = Math.max(24, textHeight + 12);
      currentY = ensureSpace(currentY, rowHeight);

      if (index % 2 === 1) {
        doc.rect(page.left, currentY, page.width, rowHeight).fill(colors.paper);
      }

      doc.strokeColor(colors.line).lineWidth(0.5);
      doc.moveTo(page.left, currentY + rowHeight).lineTo(page.right, currentY + rowHeight).stroke();

      setFont().fontSize(8.8).fillColor(colors.ink);
      doc.text(String(index + 1), columns.no.x + 8, currentY + 6, {
        width: columns.no.width - 12,
        align: "center"
      });
      doc.text(item.material, columns.item.x + 10, currentY + 6, {
        width: columns.item.width - 18
      });
      doc.text(String(item.quantity), columns.qty.x + 8, currentY + 6, {
        width: columns.qty.width - 12,
        align: "center"
      });
      doc.text(formatMoney(item.amount), columns.rate.x + 8, currentY + 6, {
        width: columns.rate.width - 14,
        align: "right"
      });
      doc.text(formatMoney(item.quantity * item.amount), columns.amount.x + 8, currentY + 6, {
        width: columns.amount.width - 14,
        align: "right"
      });

      currentY += rowHeight;
    });

    const itemsTotal = numberValue(total);
    const transport = numberValue(transportationCharge);
    const grandTotal = itemsTotal + transport;

    const totals = { x: 350, width: 215, height: 92, grandHeight: 34 };
    currentY = ensureSpace(currentY + 16, totals.height, false);

    doc.save();
    doc.roundedRect(totals.x, currentY, totals.width, totals.height, 6).clip();
    doc.rect(totals.x, currentY, totals.width, totals.height).fill(colors.white);
    doc
      .rect(totals.x, currentY + totals.height - totals.grandHeight, totals.width, totals.grandHeight)
      .fill(colors.maroon);
    doc.restore();
    doc
      .roundedRect(totals.x, currentY, totals.width, totals.height, 6)
      .strokeColor(colors.line)
      .lineWidth(0.8)
      .stroke();

    setFont().fontSize(9).fillColor(colors.muted);
    doc.text("Items Total", totals.x + 14, currentY + 13, { width: 90 });
    doc.text("Transportation", totals.x + 14, currentY + 33, { width: 90 });
    setFont(true).fontSize(9.2).fillColor(colors.ink);
    doc.text(formatMoney(itemsTotal), totals.x + 95, currentY + 13, { width: 106, align: "right" });
    doc.text(formatMoney(transport), totals.x + 95, currentY + 33, { width: 106, align: "right" });

    const grandY = currentY + totals.height - totals.grandHeight;
    setFont(true).fontSize(9.5).fillColor(colors.white).text("Grand Total", totals.x + 14, grandY + 11, { width: 85 });
    setFont(true).fontSize(12).fillColor(colors.gold).text(formatMoney(grandTotal), totals.x + 95, grandY + 9, {
      width: 106,
      align: "right"
    });

    const pageRange = doc.bufferedPageRange();
    for (let i = 0; i < pageRange.count; i += 1) {
      doc.switchToPage(pageRange.start + i);
      drawFooter(i + 1, pageRange.count);
    }

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

