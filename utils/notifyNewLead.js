import nodemailer from "nodemailer";

/**
 * Emails the business when an enquiry arrives.
 *
 * Every failure here is swallowed on purpose. The lead is already saved by the
 * time this runs, and a customer who filled in the form correctly must never
 * see an error because an SMTP host was unreachable. Failures are logged for
 * the operator instead.
 *
 * With no SMTP_* variables set this is a silent no-op, so the app runs
 * unchanged until mail is configured.
 */

let transporter;
let warnedUnconfigured = false;

const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    if (!warnedUnconfigured) {
      console.warn(
        "⚠ SMTP is not configured — new enquiries will be saved but no notification will be sent."
      );
      warnedUnconfigured = true;
    }
    return null;
  }

  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 587);
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
  }

  return transporter;
};

const line = (label, value) => (value ? `${label}: ${value}\n` : "");

export const notifyNewLead = async (contact) => {
  try {
    const mail = getTransporter();
    if (!mail) return;

    const to = process.env.LEAD_NOTIFY_TO || process.env.SMTP_USER;
    const received = new Date(contact.createdAt || Date.now()).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kolkata"
    });

    await mail.sendMail({
      from: process.env.SMTP_FROM || `"Chinmayi Events" <${process.env.SMTP_USER}>`,
      to,
      replyTo: contact.email || undefined,
      subject: `New enquiry — ${contact.name} (${contact.eventType})`,
      text:
        `A new enquiry came in through the website.\n\n` +
        line("Name", contact.name) +
        line("Phone", contact.phone) +
        line("Email", contact.email) +
        line("Event type", contact.eventType) +
        line("Message", contact.message) +
        line("Received", received) +
        `\nOpen the admin panel to mark it as contacted.\n`
    });
  } catch (error) {
    console.error("Lead notification failed (the enquiry was still saved):", error.message);
  }
};
