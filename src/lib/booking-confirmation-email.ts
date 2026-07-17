import nodemailer from "nodemailer";

const FACEBOOK_PAGE_URL =
  "https://www.facebook.com/people/The-Memory-Club-Camera-Rental/61591490163369/";

export type BookingConfirmationEmailData = {
  toEmail: string;
  fullName: string;
  equipmentNames: string[];
  addonNames: string[];
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  totalAmountLabel: string;
};

function getTransporter() {
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  if (!user || !password) {
    throw new Error("SMTP_USER and SMTP_PASSWORD must be set to send emails.");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass: password },
  });
}

export async function sendBookingConfirmationEmail(data: BookingConfirmationEmailData) {
  const transporter = getTransporter();

  const itemLines = [...data.equipmentNames, ...data.addonNames]
    .map((name) => `  - ${name}`)
    .join("\n");

  const text = `Hi ${data.fullName},

Thanks for submitting your rental application with The Memory Club! Here's a summary of your booking request:

Pickup: ${data.pickupDate} at ${data.pickupTime}
Return: ${data.returnDate} at ${data.returnTime}

Items:
${itemLines}

Total: ${data.totalAmountLabel}

This booking is not yet confirmed. To settle payment and receive your official booking confirmation, please message our Facebook page: The Memory Club - Camera Rental

Thank you,
The Memory Club`;

  const html = `<p>Hi ${data.fullName},</p>
<p>Thanks for submitting your rental application with The Memory Club! Here's a summary of your booking request:</p>
<p><strong>Pickup:</strong> ${data.pickupDate} at ${data.pickupTime}<br/>
<strong>Return:</strong> ${data.returnDate} at ${data.returnTime}</p>
<p><strong>Items:</strong><br/>${[...data.equipmentNames, ...data.addonNames].join("<br/>")}</p>
<p><strong>Total:</strong> ${data.totalAmountLabel}</p>
<p>This booking is not yet confirmed. To settle payment and receive your official booking confirmation, please message our Facebook page: <a href="${FACEBOOK_PAGE_URL}">${FACEBOOK_PAGE_URL}</a></p>
<p>Thank you,<br/>The Memory Club</p>`;

  await transporter.sendMail({
    from: `"The Memory Club" <${process.env.SMTP_USER}>`,
    to: data.toEmail,
    subject: "Your Booking Request - The Memory Club",
    text,
    html,
  });
}
