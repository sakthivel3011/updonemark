const functions = require("firebase-functions");
const nodemailer = require("nodemailer");

// Initialize nodemailer transport for Brevo
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_EMAIL || "a9f591001@smtp-brevo.com",
    pass: process.env.BREVO_PASSWORD
  }
});

exports.sendMail = functions.https.onCall(async (data, context) => {
  const { to, subject, htmlBody, attachment } = data;
  
  if (!to || !subject || !htmlBody) {
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with "to", "subject", and "htmlBody" arguments.');
  }

  const mailOptions = {
    from: `"UpDone Mark" <${process.env.BREVO_EMAIL || "a9f591001@smtp-brevo.com"}>`,
    to,
    subject,
    html: htmlBody
  };

  // If an attachment is provided (expected as base64 string)
  if (attachment && attachment.filename && attachment.content) {
    mailOptions.attachments = [
      {
        filename: attachment.filename,
        content: attachment.content,
        encoding: 'base64'
      }
    ];
  }

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    throw new functions.https.HttpsError('internal', 'Unable to send email', error);
  }
});
