// Quick test to verify Resend works
require("dotenv").config();
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  console.log("Testing Resend setup...");
  console.log("RESEND_API_KEY exists:", !!process.env.RESEND_API_KEY);
  console.log("TEST_EMAIL target:", process.env.TEST_EMAIL);

  try {
    // ⚡ FIX: Removed markdown link syntax "[onboarding@resend.dev](mailto:...)"
    const response = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: process.env.TEST_EMAIL,
      subject: "OTP Test Email",
      html: `
        <div style="font-family:sans-serif;padding:20px;">
          <h2>Test Email</h2>
          <p>This is a test OTP:</p>
          <h1 style="letter-spacing:4px;">123456</h1>
        </div>
      `,
    });

    // ⚡ FIX: Cleaned up the broken markdown code block wrapper that was inside your javascript loop
    console.log("Response received from Resend API:");
    console.log(JSON.stringify(response, null, 2));

    if (response.error) {
      console.error("❌ Resend API returned an error:", response.error);
    } else {
      console.log("✅ Email sent successfully");
    }
  } catch (error) {
    console.error("❌ Exception thrown during execution:");
    console.error(error);
    process.exit(1);
  }
}

testEmail();
