const db = require("../config/db");
const {
  ensureDateWithinRange,
  getWorkingDaysCount,
  isDayExcluded,
  isWeekend,
  listDatesInclusive,
  normalizeDateString,
  parseDate,
  toDateString,
} = require("../utils/date");
const { roundTo2, toNumber } = require("../utils/number");

const BUDGET_SYSTEMS = {
  CARRY_OVER: "carry_over",
  INVEST: "invest",
  NOTHING: "nothing",
};

function normalizeBudgetSystem(value) {
  const raw = String(value || "")
    .trim()
    .toLowerCase();
  const sanitized = raw.replace(/[\s-]+/g, "_");

  if (
    sanitized === BUDGET_SYSTEMS.CARRY_OVER ||
    sanitized === "carryover" ||
    sanitized === "carry"
  ) {
    return BUDGET_SYSTEMS.CARRY_OVER;
  }

  if (
    sanitized === BUDGET_SYSTEMS.INVEST ||
    sanitized === "invest_system" ||
    sanitized === "investment" ||
    sanitized === "tabungan"
  ) {
    return BUDGET_SYSTEMS.INVEST;
  }

  return BUDGET_SYSTEMS.NOTHING;
}

function calculateDailyBudgetBase(totalBudget, workingDaysCount) {
  if (workingDaysCount <= 0) {
    return 0;
  }

  return roundTo2(toNumber(totalBudget) / workingDaysCount);
}

function normalizeExcludedWeekdays(excludedWeekdays) {
  if (!Array.isArray(excludedWeekdays)) {
    return [0, 6];
  }

  const normalized = [
    ...new Set(excludedWeekdays.map((day) => Number(day))),
  ].filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);

  return normalized.sort((a, b) => a - b);
}

function parseExcludedWeekdays(value) {
  if (Array.isArray(value)) {
    return normalizeExcludedWeekdays(value);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return normalizeExcludedWeekdays(parsed);
    } catch (_error) {
      return [0, 6];
    }
  }

  return [0, 6];
}

async function getBudgetPeriodById(userId, budgetPeriodId) {
  return db("budget_periods")
    .where({ id: budgetPeriodId, user_id: userId })
    .first();
}

async function getSpentMapByDate({ userId, categoryId, startDate, endDate }) {
  const query = db("transactions")
    .select("date")
    .sum({ total: "amount" })
    .where({
      user_id: userId,
      type: "expense",
    })
    .andWhere("date", ">=", toDateString(startDate))
    .andWhere("date", "<=", toDateString(endDate));

  if (categoryId) {
    query.andWhere("category_id", categoryId);
  }

  const rows = await query.groupBy("date");

  const map = new Map();
  for (const row of rows) {
    map.set(normalizeDateString(row.date), toNumber(row.total));
  }

  return map;
}

async function getDailyStatus(budgetPeriod, targetDate) {
  const statuses = await getDailyStatusesInRange(
    budgetPeriod,
    targetDate,
    targetDate,
  );

  return statuses[0] || null;
}

async function getDailyStatusesInRange(
  budgetPeriod,
  rangeStartDate,
  rangeEndDate,
) {
  const periodStartDate = parseDate(budgetPeriod.start_date, "start_date");
  const periodEndDate = parseDate(budgetPeriod.end_date, "end_date");

  ensureDateWithinRange(
    rangeStartDate,
    periodStartDate,
    periodEndDate,
    "start_date",
  );
  ensureDateWithinRange(
    rangeEndDate,
    periodStartDate,
    periodEndDate,
    "end_date",
  );

  if (rangeStartDate > rangeEndDate) {
    const error = new Error("start_date cannot be greater than end_date.");
    error.statusCode = 400;
    throw error;
  }

  const days = listDatesInclusive(periodStartDate, rangeEndDate);
  const excludedWeekdays = parseExcludedWeekdays(
    budgetPeriod.excluded_weekdays,
  );
  const spentMap = await getSpentMapByDate({
    userId: budgetPeriod.user_id,
    categoryId: budgetPeriod.category_id,
    startDate: periodStartDate,
    endDate: rangeEndDate,
  });

  let carryOver = 0;
  let investedTotal = 0;

  const dailyBase = toNumber(budgetPeriod.daily_budget_base);
  const rangeStartString = toDateString(rangeStartDate);
  const rangeEndString = toDateString(rangeEndDate);
  const budgetSystem = normalizeBudgetSystem(budgetPeriod.budget_system);
  const useCarryOver = budgetSystem === BUDGET_SYSTEMS.CARRY_OVER;
  const useInvest = budgetSystem === BUDGET_SYSTEMS.INVEST;
  const statuses = [];

  for (const day of days) {
    const dayString = toDateString(day);
    const excludedDay = isDayExcluded(day, excludedWeekdays);
    const base = excludedDay ? 0 : dailyBase;
    const carryOverApplied = useCarryOver ? carryOver : 0;
    const effectiveBudget = roundTo2(base + carryOverApplied);
    const spent = roundTo2(spentMap.get(dayString) || 0);
    const dayRemaining = roundTo2(effectiveBudget - spent);
    const investedToday = useInvest && dayRemaining > 0 ? dayRemaining : 0;

    if (dayString >= rangeStartString && dayString <= rangeEndString) {
      const investedBefore = roundTo2(investedTotal);
      const investedForDay = roundTo2(investedToday);

      statuses.push({
        date: dayString,
        budget_system: budgetSystem,
        base: roundTo2(base),
        carry_over: roundTo2(carryOverApplied),
        invested_before: investedBefore,
        invested_today: investedForDay,
        invested_total: roundTo2(investedBefore + investedForDay),
        effective_budget: effectiveBudget,
        total_spent: spent,
        remaining: dayRemaining,
        is_excluded_day: excludedDay,
        is_weekend: isWeekend(day),
      });
    }

    carryOver = roundTo2(dayRemaining);
    investedTotal = roundTo2(investedTotal + investedToday);
  }

  return statuses;
}

module.exports = {
  calculateDailyBudgetBase,
  BUDGET_SYSTEMS,
  getBudgetPeriodById,
  getDailyStatus,
  getDailyStatusesInRange,
  getWorkingDaysCount,
  normalizeBudgetSystem,
  normalizeExcludedWeekdays,
  parseExcludedWeekdays,
};
