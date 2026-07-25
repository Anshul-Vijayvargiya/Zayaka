import jwt from "jsonwebtoken";

export function signToken(user) {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      restaurantId: user.restaurantId || null,
      name: user.name,
    },
    process.env.JWT_SECRET || "fallback-secret-zayka",
    { expiresIn: "7d" }
  );
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Sign in to continue." });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret-zayka");
    next();
  } catch {
    return res.status(401).json({ error: "Session expired. Sign in again." });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "You don't have access to this." });
    }
    next();
  };
}
