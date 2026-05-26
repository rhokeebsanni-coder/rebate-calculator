// Quick test to verify Gmail credentials work
require("dotenv").config();
const nodemailer = require("nodemailer");

async function testEmail() {
  console.log("Testing Gmail setup...");
  console.log("EMAIL_USER:", process.env.EMAIL_USER);
  console.log("EMAIL_PASS length:", process.env.EMAIL_PASS?.length);

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const testResult = await transporter.verify();
    console.log("✅ Gmail connection verified:", testResult);

    // Send test email
    const result = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: "OTP Test Email",
      text: "This is a test OTP: 123456",
    });

    console.log("✅ Test email sent:", result.messageId);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

testEmail();
