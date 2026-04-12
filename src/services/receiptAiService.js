const env = require("../config/env");
const { parseDate, toDateString } = require("../utils/date");
const sharp = require("sharp");

const RECEIPT_PROMPT = `You are an OCR + receipt parser for Indonesian receipts.
Extract transaction data from the provided receipt image/document.
Return ONLY valid JSON without markdown or explanation.

Required JSON shape:
{
  "type": "expense" | "income" | null,
  "amount": number | null,
  "date": "YYYY-MM-DD" | null,
  "note": string | null,
  "suggested_category": string | null,
  "merchant_name": string | null,
  "confidence": number
}

Rules:
- Usually receipts are expense, unless there is clear evidence of income.
- amount must be the final payable total (not subtotal, tax-only, or discount).
- date must use YYYY-MM-DD if found.
- note should be short and human friendly in Indonesian.
- suggested_category should be one category name most relevant to the transaction.
- confidence is between 0 and 1.
- If a value is unknown, return null for that field.
`;

function ensureConfigured() {
  if (!env.geminiApiKey) {
    const error = new Error(
      "AI receipt scan is not configured. Set GEMINI_API_KEY first.",
    );
    error.statusCode = 503;
    throw error;
  }
}

function stripJsonFences(value) {
  const text = String(value || "").trim();
  if (!text.startsWith("```") && !text.endsWith("```")) {
    return text;
  }

  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

function parseAiJson(text) {
  const cleaned = stripJsonFences(text);
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    const parseError = new Error(
      "AI response could not be parsed. Please try again.",
    );
    parseError.statusCode = 502;
    throw parseError;
  }
}

function normalizeType(value) {
  if (!value) return null;
  const raw = String(value).trim().toLowerCase();

  if (["income", "pemasukan", "masuk"].includes(raw)) {
    return "income";
  }

  if (["expense", "pengeluaran", "keluar", "belanja"].includes(raw)) {
    return "expense";
  }

  return null;
}

function normalizeAmount(value) {
  if (value === null || typeof value === "undefined") return null;

  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  const raw = String(value)
    .replace(/[^\d,.-]/g, "")
    .trim();
  if (!raw) return null;

  const hasComma = raw.includes(",");
  const hasDot = raw.includes(".");

  let normalized = raw;
  if (hasComma && hasDot) {
    normalized = raw.replace(/\./g, "").replace(/,/g, ".");
  } else if (hasComma) {
    normalized = raw.replace(/,/g, ".");
  }

  const amount = Number(normalized);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function normalizeDate(value) {
  if (!value) return null;

  const raw = String(value).trim();
  if (!raw) return null;

  try {
    return toDateString(parseDate(raw, "receipt date"));
  } catch {
    // Continue to fallback parsing for common receipt formats.
  }

  const slashOrDashMatch = raw.match(
    /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/,
  );

  if (!slashOrDashMatch) {
    return null;
  }

  const day = Number(slashOrDashMatch[1]);
  const month = Number(slashOrDashMatch[2]);
  let year = Number(slashOrDashMatch[3]);

  if (year < 100) {
    year += 2000;
  }

  const isoDate = `${year.toString().padStart(4, "0")}-${month
    .toString()
    .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;

  try {
    return toDateString(parseDate(isoDate, "receipt date"));
  } catch {
    return null;
  }
}

function normalizeText(value, maxLength = 180) {
  if (value === null || typeof value === "undefined") {
    return null;
  }

  const text = String(value).trim();
  if (!text) return null;

  return text.length > maxLength ? text.slice(0, maxLength).trim() : text;
}

function normalizeConfidence(value) {
  const confidence = Number(value);
  if (!Number.isFinite(confidence)) return 0.5;
  if (confidence < 0) return 0;
  if (confidence > 1) return 1;
  return confidence;
}

function normalizeReceiptExtraction(rawResult) {
  return {
    type: normalizeType(rawResult?.type) || "expense",
    amount: normalizeAmount(rawResult?.amount),
    date: normalizeDate(rawResult?.date),
    note: normalizeText(rawResult?.note, 1000),
    suggested_category: normalizeText(rawResult?.suggested_category, 120),
    merchant_name: normalizeText(rawResult?.merchant_name, 120),
    confidence: normalizeConfidence(rawResult?.confidence),
  };
}

function buildPrompt(categories) {
  const categoryNames = categories
    .map((category) => category.name)
    .filter(Boolean)
    .join(", ");

  if (!categoryNames) {
    return RECEIPT_PROMPT;
  }

  return `${RECEIPT_PROMPT}\nKnown user categories: ${categoryNames}`;
}

function extractModelText(payload) {
  const parts = payload?.candidates?.[0]?.content?.parts || [];
  const textPart = parts.find((part) => typeof part.text === "string");
  return textPart?.text || "";
}

function replaceFileExtensionWithPng(fileName) {
  const source = String(fileName || "receipt").trim() || "receipt";
  return source.replace(/\.[a-z0-9]+$/i, "") + ".png";
}

async function prepareReceiptInputForAi({ fileBuffer, mimeType, fileName }) {
  const normalizedMimeType = String(mimeType || "").toLowerCase();

  if (normalizedMimeType === "application/pdf") {
    return {
      fileBuffer,
      mimeType: "application/pdf",
      fileName,
    };
  }

  if (!normalizedMimeType.startsWith("image/")) {
    const error = new Error("Unsupported receipt file type for AI processing.");
    error.statusCode = 400;
    throw error;
  }

  try {
    const pngBuffer = await sharp(fileBuffer)
      .rotate()
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toBuffer();

    return {
      fileBuffer: pngBuffer,
      mimeType: "image/png",
      fileName: replaceFileExtensionWithPng(fileName),
    };
  } catch (_error) {
    const error = new Error(
      "Image could not be processed. Please upload a clearer receipt image.",
    );
    error.statusCode = 422;
    throw error;
  }
}

async function analyzeReceiptWithGemini({
  fileBuffer,
  mimeType,
  fileName,
  categories,
}) {
  ensureConfigured();

  const preparedInput = await prepareReceiptInputForAi({
    fileBuffer,
    mimeType,
    fileName,
  });

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    env.geminiModel,
  )}:generateContent?key=${encodeURIComponent(env.geminiApiKey)}`;

  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [
          { text: buildPrompt(categories) },
          {
            inline_data: {
              mime_type: preparedInput.mimeType,
              data: preparedInput.fileBuffer.toString("base64"),
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    },
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const detail = await response.text();
    const error = new Error(
      `Gemini API request failed (${response.status}). ${detail.slice(0, 250)}`,
    );
    error.statusCode = 502;
    throw error;
  }

  const payload = await response.json();
  const text = extractModelText(payload);

  if (!text) {
    const error = new Error(
      "AI could not read the receipt. Please try a clearer file.",
    );
    error.statusCode = 422;
    throw error;
  }

  const normalized = normalizeReceiptExtraction(parseAiJson(text));

  return {
    ...normalized,
    source_file_name: preparedInput.fileName || null,
    source_mime_type: preparedInput.mimeType || null,
  };
}

module.exports = {
  analyzeReceiptWithGemini,
};
