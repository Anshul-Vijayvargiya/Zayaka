import nodemailer from "nodemailer";

export async function sendOtpEmail(to, code) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env;

  if (SMTP_USER && SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST || "smtp.gmail.com",
        port: Number(SMTP_PORT) || 587,
        secure: Number(SMTP_PORT) === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      });

      await transporter.sendMail({
        from: MAIL_FROM || `"Zayka" <${SMTP_USER}>`,
        to,
        subject: `${code} is your Zayka verification code`,
        text: `Your Zayka verification code is: ${code}. It will expire in 10 minutes.`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #1A1E2E;">
            <h2 style="color: #E8830C;">Zayka Verification Code</h2>
            <p>Your verification code for Zayka is:</p>
            <h1 style="letter-spacing: 4px; background: #FDF0E0; display: inline-block; padding: 10px 20px; border-radius: 8px; color: #E8830C;">${code}</h1>
            <p>This code expires in 10 minutes.</p>
          </div>
        `,
      });
      console.log(`[Mailer] OTP email sent successfully to ${to}`);
      return;
    } catch (e) {
      console.error(`[Mailer Error] Failed to send email to ${to}:`, e.message);
    }
  }

  // Fallback for dev mode
  console.log("\n=======================================================");
  console.log(`[DEV MAIL FALLBACK] Verification OTP for ${to}: [ ${code} ]`);
  console.log("=======================================================\n");
}
