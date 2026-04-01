const jwt = require("jsonwebtoken");
const db = require("../config/db");
const env = require("../config/env");

async function authenticate(req, res, next) {
  const authorization = req.headers.authorization || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res
      .status(401)
      .json({ message: "Missing or invalid authorization header." });
  }

  try {
    const isRevoked = await db("revoked_tokens").where({ token }).first();
    if (isRevoked) {
      return res
        .status(401)
        .json({ message: "Token has been revoked. Please login again." });
    }

    const payload = jwt.verify(token, env.jwtSecret);
    req.user = {
      id: Number(payload.sub),
      email: payload.email,
      name: payload.name,
    };
    req.token = token;

    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

module.exports = {
  authenticate,
};
