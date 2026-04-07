const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const db = require("../config/db");
const { verifyFirebaseIdToken } = require("../services/firebaseAdmin");
const { signToken } = require("../utils/jwt");
const { extractInsertedId } = require("../utils/db");

async function seedDefaultCategories(userId) {
  const defaultCategories = [
    { user_id: userId, name: "Gaji", type: "income" },
    { user_id: userId, name: "Makanan", type: "expense" },
    { user_id: userId, name: "Transportasi", type: "expense" },
    { user_id: userId, name: "Hiburan", type: "expense" },
    { user_id: userId, name: "Lainnya", type: "expense" },
  ];
  await db("categories").insert(defaultCategories);
}

const registerSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const googleLoginSchema = z.object({
  idToken: z.string().min(1),
});

function buildAuthResponse(message, user) {
  const token = signToken(user);

  return {
    message,
    data: {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    },
  };
}

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
      auth_provider: "local",
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

  if (user) {
    await seedDefaultCategories(user.id);
  }

  return res
    .status(201)
    .json(buildAuthResponse("Registration successful.", user));
}

async function login(req, res) {
  const payload = loginSchema.parse(req.body);

  const user = await db("users")
    .whereRaw("LOWER(email) = LOWER(?)", [payload.email])
    .first();

  if (!user) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  if (!user.password) {
    return res.status(401).json({
      message: "This account uses Google login. Please login with Google.",
    });
  }

  const validPassword = await bcrypt.compare(payload.password, user.password);
  if (!validPassword) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  return res.json(buildAuthResponse("Login successful.", user));
}

async function googleLogin(req, res) {
  const payload = googleLoginSchema.parse(req.body);

  let decodedToken;

  try {
    decodedToken = await verifyFirebaseIdToken(payload.idToken);
  } catch (error) {
    return res.status(401).json({ message: "Invalid Firebase ID token." });
  }

  const firebaseUid = decodedToken.uid;
  const email = decodedToken.email ? decodedToken.email.toLowerCase() : null;

  if (!email) {
    return res
      .status(400)
      .json({ message: "Firebase token does not contain email." });
  }

  let user = await db("users").where({ firebase_uid: firebaseUid }).first();

  if (!user) {
    user = await db("users")
      .whereRaw("LOWER(email) = LOWER(?)", [email])
      .first();
  }

  if (user && user.firebase_uid && user.firebase_uid !== firebaseUid) {
    return res.status(409).json({
      message: "Email is already linked to a different Google account.",
    });
  }

  if (!user) {
    const insertResult = await db("users")
      .insert({
        name: decodedToken.name || email.split("@")[0],
        email,
        password: null,
        firebase_uid: firebaseUid,
        auth_provider: "google",
      })
      .returning("id");

    const insertedId = extractInsertedId(insertResult);

    if (insertedId) {
      user = await db("users").where({ id: insertedId }).first();
    }

    if (!user) {
      user = await db("users").where({ firebase_uid: firebaseUid }).first();
    }

    if (user) {
      await seedDefaultCategories(user.id);
    }

    return res
      .status(201)
      .json(buildAuthResponse("Google login successful.", user));
  }

  const updates = {};

  if (!user.firebase_uid) {
    updates.firebase_uid = firebaseUid;
  }

  if (!user.auth_provider && !user.password) {
    updates.auth_provider = "google";
  }

  if (Object.keys(updates).length > 0) {
    await db("users").where({ id: user.id }).update(updates);
    user = await db("users").where({ id: user.id }).first();
  }

  return res.json(buildAuthResponse("Google login successful.", user));
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
  googleLogin,
  login,
  logout,
  register,
};
