function extractInsertedId(insertResult) {
  if (!Array.isArray(insertResult) || insertResult.length === 0) {
    return null;
  }

  const first = insertResult[0];

  if (typeof first === "number" || typeof first === "string") {
    return Number(first);
  }

  if (first && typeof first === "object") {
    if (typeof first.id !== "undefined") {
      return Number(first.id);
    }

    if (typeof first.insertId !== "undefined") {
      return Number(first.insertId);
    }
  }

  return null;
}

module.exports = {
  extractInsertedId,
};
