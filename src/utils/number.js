function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return fallback;
  return parsed;
}

function roundTo2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

module.exports = {
  roundTo2,
  toNumber,
};
