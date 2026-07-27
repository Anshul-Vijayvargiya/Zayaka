function buildHtml(code) {
  return `
    <div style="font-family: sans-serif; padding: 20px; color: #1A1E2E;">
      <h2 style="color: #E8830C;">Verify your email</h2>
      <p>Your verification code for Zayka is:</p>
      <h1 style="letter-spacing: 4px; background: #FDF0E0; display: inline-block; padding: 10px 20px; border-radius: 8px; color: #E8830C;">${code}</h1>
      <p>This code expires in 10 minutes.</p>
    </div>
  `;
}

function logFallback(to, code) {
  console.log("\n=======================================================");
  console.log(`[DEV MAIL FALLBACK] Verification OTP for ${to}: [ ${code} ]`);
  console.log("=======================================================\n");
}

export async function sendOtpEmail(to, code) {
  const { BREVO_API_KEY, MAIL_FROM_EMAIL } = process.env;

  if (!BREVO_API_KEY) {
    logFallback(to, code);
    return;
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "Zayka", email: MAIL_FROM_EMAIL },
        to: [{ email: to }],
        subject: `${code} is your Zayka verification code`,
        htmlContent: buildHtml(code),
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[Mailer Error] Brevo API returned ${res.status} for ${to}: ${body}`);
      logFallback(to, code);
      return;
    }

    console.log(`[Mailer] OTP email sent successfully to ${to} (status ${res.status})`);
  } catch (e) {
    console.error(`[Mailer Error] Failed to reach Brevo API for ${to}:`, e.message);
    logFallback(to, code);
  }
}
