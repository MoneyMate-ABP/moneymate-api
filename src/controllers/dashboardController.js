const { startOfToday } = require("date-fns");
const db = require("../config/db");
const { getDailyStatus } = require("../services/budgetService");
const { normalizeDateString, toDateString } = require("../utils/date");
const { roundTo2, toNumber } = require("../utils/number");

async function getDashboard(req, res) {
  const userId = req.user.id;

  const [incomeSummary, expenseSummary] = await Promise.all([
    db("transactions")
      .sum({ total: "amount" })
      .where({ user_id: userId, type: "income" })
      .first(),
    db("transactions")
      .sum({ total: "amount" })
      .where({ user_id: userId, type: "expense" })
      .first(),
  ]);

  const totalIncome = toNumber(incomeSummary.total);
  const totalExpense = toNumber(expenseSummary.total);
  const totalBalance = roundTo2(totalIncome - totalExpense);

  const today = startOfToday();
  const todayStr = toDateString(today);

  const activePeriods = await db("budget_periods")
    .leftJoin("categories", "budget_periods.category_id", "categories.id")
    .select(
      "budget_periods.*",
      "categories.name as category_name",
      "categories.type as category_type",
    )
    .where("budget_periods.user_id", userId)
    .andWhere("budget_periods.start_date", "<=", todayStr)
    .andWhere("budget_periods.end_date", ">=", todayStr)
    .orderBy("budget_periods.created_at", "desc");

  const budgetStatuses = await Promise.all(
    activePeriods.map(async (period) => {
      const daily = await getDailyStatus(period, today);
      return {
        budget_period_id: period.id,
        name: period.name,
        category_id: period.category_id,
        category_name: period.category_name,
        category_type: period.category_type,
        start_date: normalizeDateString(period.start_date, "start_date"),
        end_date: normalizeDateString(period.end_date, "end_date"),
        daily_status: daily,
      };
    }),
  );

  const budgetEffectiveToday = roundTo2(
    budgetStatuses.reduce(
      (acc, item) => acc + toNumber(item.daily_status.effective_budget),
      0,
    ),
  );

  const budgetRemainingToday = roundTo2(
    budgetStatuses.reduce(
      (acc, item) => acc + toNumber(item.daily_status.remaining),
      0,
    ),
  );

  const budgetSpentToday = roundTo2(
    budgetStatuses.reduce(
      (acc, item) => acc + toNumber(item.daily_status.total_spent),
      0,
    ),
  );

  return res.json({
    data: {
      totals: {
        balance: totalBalance,
        income: totalIncome,
        expense: totalExpense,
      },
      budgets: {
        active_count: budgetStatuses.length,
        effective_today: budgetEffectiveToday,
        spent_today: budgetSpentToday,
        remaining_today: budgetRemainingToday,
        status: budgetStatuses,
      },
    },
  });
}

module.exports = {
  getDashboard,
};
