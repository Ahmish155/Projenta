export const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};

// Centralized error handler. Requires "express-async-errors" to be imported
// once at the top of server.js — without it, Express 4 does NOT forward
// errors thrown inside async route handlers here; they'd become unhandled
// promise rejections instead, which can crash the whole process on a single
// bad request (e.g. a malformed ObjectId in a URL).
export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  let statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || "Internal Server Error";

  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format";
  } else if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(", ");
  } else if (err.code === 11000) {
    statusCode = 409;
    message = "That value is already in use";
  }

  // Never leak internal error details for unexpected 500s in production.
  if (statusCode === 500 && process.env.NODE_ENV === "production") {
    message = "Something went wrong. Please try again.";
  }

  res.status(statusCode).json({ message });
};
