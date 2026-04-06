const bcrypt = require("bcryptjs");
const {
  getWorkingDaysCount,
  parseDate,
  toDateString,
} = require("../../utils/date");

const DUMMY_USER = {
  name: "Dummy User",
  email: "dummy@test.com",
  password: "password123",
};

const DUMMY_BUDGET = {
  name: "Budget April 2026",
  totalBudget: 1000000,
  startDate: "2026-04-01",
  endDate: "2026-04-30",
};

const DUMMY_TRANSACTIONS = [30000, 50000, 43000, 63000, 15000].map(
  (amount, index) => ({
    amount,
    date: `2026-04-0${index + 1}`,
    note: `seed:dummy-apr-2026-day-${index + 1}`,
  }),
);

function roundTo2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

async function ensureExpenseCategory(knex) {
  let category = await knex("categories").where({ name: "Makanan" }).first();

  if (!category) {
    await knex("categories").insert({
      name: "Makanan",
      type: "expense",
    });

    category = await knex("categories").where({ name: "Makanan" }).first();
  }

  return category;
}

async function ensureDummyUser(knex) {
  const lowerEmail = DUMMY_USER.email.toLowerCase();
  let user = await knex("users")
    .whereRaw("LOWER(email) = LOWER(?)", [lowerEmail])
    .first();

  if (!user) {
    const passwordHash = await bcrypt.hash(DUMMY_USER.password, 10);

    await knex("users").insert({
      name: DUMMY_USER.name,
      email: lowerEmail,
      password: passwordHash,
    });

    user = await knex("users")
      .whereRaw("LOWER(email) = LOWER(?)", [lowerEmail])
      .first();
    return user;
  }

  if (!user.password) {
    const passwordHash = await bcrypt.hash(DUMMY_USER.password, 10);

    await knex("users").where({ id: user.id }).update({
      password: passwordHash,
    });

    user = await knex("users").where({ id: user.id }).first();
  }

  return user;
}

async function ensureDummyBudgetPeriod(knex, userId, categoryId) {
  const startDate = parseDate(DUMMY_BUDGET.startDate, "startDate");
  const endDate = parseDate(DUMMY_BUDGET.endDate, "endDate");
  const workingDaysCount = getWorkingDaysCount(startDate, endDate);
  const dailyBudgetBase = roundTo2(DUMMY_BUDGET.totalBudget / workingDaysCount);

  let budgetPeriod = await knex("budget_periods")
    .where({
      user_id: userId,
      name: DUMMY_BUDGET.name,
      start_date: toDateString(startDate),
      end_date: toDateString(endDate),
    })
    .first();

  if (!budgetPeriod) {
    await knex("budget_periods").insert({
      user_id: userId,
      category_id: categoryId,
      name: DUMMY_BUDGET.name,
      total_budget: DUMMY_BUDGET.totalBudget,
      start_date: toDateString(startDate),
      end_date: toDateString(endDate),
      daily_budget_base: dailyBudgetBase,
      working_days_count: workingDaysCount,
    });

    budgetPeriod = await knex("budget_periods")
      .where({
        user_id: userId,
        name: DUMMY_BUDGET.name,
        start_date: toDateString(startDate),
        end_date: toDateString(endDate),
      })
      .first();

    return budgetPeriod;
  }

  await knex("budget_periods").where({ id: budgetPeriod.id }).update({
    category_id: categoryId,
    total_budget: DUMMY_BUDGET.totalBudget,
    daily_budget_base: dailyBudgetBase,
    working_days_count: workingDaysCount,
  });

  return knex("budget_periods").where({ id: budgetPeriod.id }).first();
}

async function upsertDummyTransactions(
  knex,
  userId,
  categoryId,
  budgetPeriodId,
) {
  for (const transaction of DUMMY_TRANSACTIONS) {
    const existing = await knex("transactions")
      .where({
        user_id: userId,
        note: transaction.note,
      })
      .first();

    const payload = {
      user_id: userId,
      category_id: categoryId,
      budget_period_id: budgetPeriodId,
      type: "expense",
      amount: transaction.amount,
      note: transaction.note,
      date: transaction.date,
    };

    if (!existing) {
      await knex("transactions").insert(payload);
      continue;
    }

    await knex("transactions").where({ id: existing.id }).update(payload);
  }
}

exports.seed = async function seed(knex) {
  const category = await ensureExpenseCategory(knex);
  const user = await ensureDummyUser(knex);
  const budgetPeriod = await ensureDummyBudgetPeriod(
    knex,
    user.id,
    category.id,
  );

  await upsertDummyTransactions(knex, user.id, category.id, budgetPeriod.id);
};
