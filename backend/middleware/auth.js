import admin from "../config/firebaseAdmin.js";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  let idToken;
  if (req.headers.authorization?.startsWith("Bearer")) {
    idToken = req.headers.authorization.split(" ")[1];
  }
  if (!idToken) {
    return res.status(401).json({ message: "Not authorized, no token provided" });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.firebaseUser = decoded; // { uid, email, name, picture, ... }

    const user = await User.findOne({ firebaseUid: decoded.uid });
    if (!user) {
      // Valid Firebase account, but not yet linked to a workspace/user record.
      // Callers hitting /auth/sync or /auth/create-workspace handle this case themselves.
      req.user = null;
      return next();
    }
    if (user.status === "deactivated") {
      return res.status(403).json({ message: "Your account has been deactivated" });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized, token invalid or expired" });
  }
};

// Use after `protect` on routes that require an existing workspace user
export const requireUser = (req, res, next) => {
  if (!req.user) {
    return res.status(404).json({ message: "No workspace account found for this login" });
  }
  next();
};

// Restrict to one or more roles, e.g. requireRole("admin"), requireRole("admin", "teamlead")
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "You don't have permission to do this" });
  }
  next();
};
