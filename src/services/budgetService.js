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

  if (raw === BUDGET_SYSTEMS.CARRY_OVER) {
    return BUDGET_SYSTEMS.CARRY_OVER;
  }

  if (raw === BUDGET_SYSTEMS.INVEST) {
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
  ensureDateWithinRange(
    targetDate,
    parseDate(budgetPeriod.start_date, "start_date"),
    parseDate(budgetPeriod.end_date, "end_date"),
    "target date",
  );

  const startDate = parseDate(budgetPeriod.start_date, "start_date");
  const days = listDatesInclusive(startDate, targetDate);
  const excludedWeekdays = parseExcludedWeekdays(
    budgetPeriod.excluded_weekdays,
  );
  const spentMap = await getSpentMapByDate({
    userId: budgetPeriod.user_id,
    categoryId: budgetPeriod.category_id,
    startDate,
    endDate: targetDate,
  });

  let carryOver = 0;
  let investedTotal = 0;
  let carryOverBeforeTarget = 0;
  let investedBeforeTarget = 0;
  let baseForTarget = 0;
  let effectiveBudgetForTarget = 0;
  let spentForTarget = 0;
  let investedForTarget = 0;

  const dailyBase = toNumber(budgetPeriod.daily_budget_base);
  const targetDateString = toDateString(targetDate);
  const budgetSystem = normalizeBudgetSystem(budgetPeriod.budget_system);
  const useCarryOver = budgetSystem === BUDGET_SYSTEMS.CARRY_OVER;
  const useInvest = budgetSystem === BUDGET_SYSTEMS.INVEST;

  for (const day of days) {
    const dayString = toDateString(day);
    const excludedDay = isDayExcluded(day, excludedWeekdays);
    const base = excludedDay ? 0 : dailyBase;
    const carryOverApplied = useCarryOver ? carryOver : 0;
    const effectiveBudget = roundTo2(base + carryOverApplied);
    const spent = roundTo2(spentMap.get(dayString) || 0);
    const dayRemaining = roundTo2(effectiveBudget - spent);
    const investedToday = useInvest && dayRemaining > 0 ? dayRemaining : 0;

    if (dayString === targetDateString) {
      carryOverBeforeTarget = roundTo2(carryOverApplied);
      investedBeforeTarget = roundTo2(investedTotal);
      baseForTarget = roundTo2(base);
      effectiveBudgetForTarget = effectiveBudget;
      spentForTarget = spent;
      investedForTarget = roundTo2(investedToday);
    }

    carryOver = roundTo2(dayRemaining);
    investedTotal = roundTo2(investedTotal + investedToday);
  }

  return {
    date: targetDateString,
    budget_system: budgetSystem,
    base: baseForTarget,
    carry_over: carryOverBeforeTarget,
    invested_before: investedBeforeTarget,
    invested_today: investedForTarget,
    invested_total: roundTo2(investedBeforeTarget + investedForTarget),
    effective_budget: effectiveBudgetForTarget,
    total_spent: spentForTarget,
    remaining: roundTo2(effectiveBudgetForTarget - spentForTarget),
    is_excluded_day: isDayExcluded(targetDate, excludedWeekdays),
    is_weekend: isWeekend(targetDate),
  };
}

module.exports = {
  calculateDailyBudgetBase,
  BUDGET_SYSTEMS,
  getBudgetPeriodById,
  getDailyStatus,
  getWorkingDaysCount,
  normalizeBudgetSystem,
  normalizeExcludedWeekdays,
  parseExcludedWeekdays,
};
