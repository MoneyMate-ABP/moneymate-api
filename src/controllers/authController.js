const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const db = require("../config/db");
const { signToken } = require("../utils/jwt");
const { extractInsertedId } = require("../utils/db");

const registerSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

async function register(req, res) {
  const payload = registerSchema.parse(req.body);

  const existing = await db("users")
    .whereRaw("LOWER(email) = LOWER(?)", [payload.email])
    .first();

  if (existing) {
    return res.status(409).json({ message: "Email already registered." });
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);

  const insertResult = await db("users")
    .insert({
      name: payload.name,
      email: payload.email.toLowerCase(),
      password: passwordHash,
    })
    .returning("id");

  let user = null;
  const insertedId = extractInsertedId(insertResult);

  if (insertedId) {
    user = await db("users").where({ id: insertedId }).first();
  }

  if (!user) {
    user = await db("users")
      .where({ email: payload.email.toLowerCase() })
      .first();
  }

  const token = signToken(user);

  return res.status(201).json({
    message: "Registration successful.",
    data: {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    },
  });
}

async function login(req, res) {
  const payload = loginSchema.parse(req.body);

  const user = await db("users")
    .whereRaw("LOWER(email) = LOWER(?)", [payload.email])
    .first();

  if (!user) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const validPassword = await bcrypt.compare(payload.password, user.password);
  if (!validPassword) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const token = signToken(user);

  return res.json({
    message: "Login successful.",
    data: {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    },
  });
}

async function logout(req, res) {
  const existingRevokedToken = await db("revoked_tokens")
    .where({ token: req.token })
    .first();

  if (!existingRevokedToken) {
    const decoded = jwt.decode(req.token);
    const expiresAt =
      decoded && decoded.exp ? new Date(decoded.exp * 1000) : null;

    await db("revoked_tokens").insert({
      user_id: req.user.id,
      token: req.token,
      expires_at: expiresAt,
    });
  }

  return res.json({ message: "Logout successful." });
}

module.exports = {
  login,
  logout,
  register,
};
