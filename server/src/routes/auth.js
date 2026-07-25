import { Router } from "express";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { User, Otp, Restaurant, Table } from "../models/index.js";
import { signToken, requireAuth } from "../middleware/auth.js";
import { sendOtpEmail } from "../utils/mailer.js";

const router = Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function makeOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function issueOtp(email) {
  const code = makeOtp();
  await Otp.deleteMany({ email });
  await Otp.create({
    email,
    code,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });
  await sendOtpEmail(email, code);
}

// Register (customer by default; role=owner also creates a restaurant)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, restaurantName } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "Name, email and password are required." });
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing && existing.verified)
      return res.status(409).json({ error: "An account with this email already exists." });
    if (existing) await User.deleteOne({ _id: existing._id });

    const user = new User({
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: role === "owner" ? "owner" : "customer",
      verified: false,
    });

    if (role === "owner") {
      const base = (restaurantName || `${name}'s Kitchen`)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      let slug = base;
      let n = 1;
      while (await Restaurant.findOne({ slug })) slug = `${base}-${n++}`;
      const restaurant = await Restaurant.create({
        name: restaurantName || `${name}'s Kitchen`,
        slug,
      });
      await Table.insertMany(
        Array.from({ length: 8 }, (_, i) => ({
          restaurantId: restaurant._id,
          number: i + 1,
          capacity: i < 4 ? 2 : 4,
        }))
      );
      user.restaurantId = restaurant._id;
    }

    await user.save();
    await issueOtp(user.email);
    res.json({ message: "Verification code sent to your email.", email: user.email });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not create the account. Try again." });
  }
});

// Verify OTP -> activate account, return JWT
router.post("/verify-otp", async (req, res) => {
  const { email, code } = req.body;
  const record = await Otp.findOne({ email: (email || "").toLowerCase(), code });
  if (!record || record.expiresAt < new Date())
    return res.status(400).json({ error: "That code is wrong or expired." });
  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { verified: true },
    { new: true }
  );
  if (!user) return res.status(404).json({ error: "Account not found." });
  await Otp.deleteMany({ email: email.toLowerCase() });
  res.json({ token: signToken(user), user: publicUser(user) });
});

router.post("/resend-otp", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: (email || "").toLowerCase() });
  if (!user) return res.status(404).json({ error: "Account not found." });
  await issueOtp(user.email);
  res.json({ message: "A new code is on its way." });
});

// Email + password login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email || "").toLowerCase() });
  if (!user || !user.passwordHash)
    return res.status(401).json({ error: "Email or password is incorrect." });
  const ok = await bcrypt.compare(password || "", user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Email or password is incorrect." });
  if (!user.verified) {
    await issueOtp(user.email);
    return res.status(403).json({ error: "unverified", email: user.email });
  }
  res.json({ token: signToken(user), user: publicUser(user) });
});

// Google OAuth: frontend sends the Google ID token, we verify it server-side
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(400).json({ error: "Google sign-in is not configured on the server." });
    }
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    let user = await User.findOne({ email: payload.email.toLowerCase() });
    if (!user) {
      user = await User.create({
        name: payload.name || payload.email.split("@")[0],
        email: payload.email,
        googleId: payload.sub,
        role: "customer",
        verified: true,
      });
    } else if (!user.verified) {
      user.verified = true;
      user.googleId = payload.sub;
      await user.save();
    }
    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (e) {
    console.error(e);
    res.status(401).json({ error: "Google sign-in failed. Try again." });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: "Account not found." });
  res.json({ user: publicUser(user) });
});

function publicUser(u) {
  return {
    id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    restaurantId: u.restaurantId || null,
  };
}

export default router;
