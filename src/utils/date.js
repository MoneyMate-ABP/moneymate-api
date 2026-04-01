const {
  addDays,
  format,
  isAfter,
  isBefore,
  isValid,
  parseISO,
  startOfDay,
} = require("date-fns");

function parseDate(value, fieldName = "date") {
  if (value instanceof Date) {
    return startOfDay(value);
  }

  const stringValue = String(value);
  const dateOnlyMatch = stringValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]) - 1;
    const day = Number(dateOnlyMatch[3]);
    return new Date(year, month, day);
  }

  const date = parseISO(stringValue);
  if (!isValid(date)) {
    throw new Error(`Invalid ${fieldName}. Use YYYY-MM-DD.`);
  }
  return startOfDay(date);
}

function normalizeDateString(value, fieldName = "date") {
  return toDateString(parseDate(value, fieldName));
}

function toDateString(date) {
  return format(date, "yyyy-MM-dd");
}

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function listDatesInclusive(startDate, endDate) {
  const dates = [];
  let cursor = startOfDay(startDate);
  const end = startOfDay(endDate);

  while (!isAfter(cursor, end)) {
    dates.push(cursor);
    cursor = addDays(cursor, 1);
  }

  return dates;
}

function ensureDateWithinRange(date, startDate, endDate, fieldName = "date") {
  const current = startOfDay(date);
  const start = startOfDay(startDate);
  const end = startOfDay(endDate);

  if (isBefore(current, start) || isAfter(current, end)) {
    throw new Error(
      `${fieldName} must be between ${toDateString(start)} and ${toDateString(end)}.`,
    );
  }
}

function getWorkingDaysCount(startDate, endDate) {
  const dates = listDatesInclusive(startDate, endDate);
  return dates.filter((date) => !isWeekend(date)).length;
}

module.exports = {
  ensureDateWithinRange,
  getWorkingDaysCount,
  isWeekend,
  listDatesInclusive,
  normalizeDateString,
  parseDate,
  toDateString,
};
