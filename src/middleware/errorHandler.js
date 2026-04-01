function notFoundHandler(req, res) {
  res.status(404).json({ message: "Endpoint not found." });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const message = err.message || "Unexpected server error.";
  const statusCode = err.statusCode || 400;

  res.status(statusCode).json({ message });
}

module.exports = {
  errorHandler,
  notFoundHandler,
};
