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
  excludedWeekdays: [0, 6],
};

const DUMMY_INCOME_TRANSACTION = {
  amount: 5500000,
  date: "2026-04-01",
  note: "seed:dummy-apr-2026-salary-income",
};

const DUMMY_TRANSACTIONS = [30000, 50000, 43000, 63000, 15000].map(
  (amount, index) => ({
    amount,
    date: `2026-04-0${index + 1}`,
    note: `seed:dummy-apr-2026-expense-day-${index + 1}`,
  }),
);

function roundTo2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

async function ensureCategory(knex, userId, name, type) {
  let category = await knex("categories").where({ user_id: userId, name }).first();

  if (!category) {
    await knex("categories").insert({
      user_id: userId,
      name,
      type,
    });

    category = await knex("categories").where({ user_id: userId, name }).first();
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
  const workingDaysCount = getWorkingDaysCount(
    startDate,
    endDate,
    DUMMY_BUDGET.excludedWeekdays,
  );
  const dailyBudgetBase = roundTo2(DUMMY_BUDGET.totalBudget / workingDaysCount);
  const serializedExcludedWeekdays = JSON.stringify(
    DUMMY_BUDGET.excludedWeekdays,
  );

  const existingDefaultPeriod = await knex("budget_periods")
    .where({ user_id: userId, is_default: true })
    .first();

  const shouldSetAsDefault = !existingDefaultPeriod;

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
      excluded_weekdays: serializedExcludedWeekdays,
      is_default: shouldSetAsDefault,
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
    excluded_weekdays: serializedExcludedWeekdays,
  });

  return knex("budget_periods").where({ id: budgetPeriod.id }).first();
}

async function upsertDummyTransactions(
  knex,
  userId,
  expenseCategoryId,
  incomeCategoryId,
  budgetPeriodId,
) {
  const existingIncome = await knex("transactions")
    .where({
      user_id: userId,
      note: DUMMY_INCOME_TRANSACTION.note,
    })
    .first();

  const incomePayload = {
    user_id: userId,
    category_id: incomeCategoryId,
    budget_period_id: null,
    type: "income",
    amount: DUMMY_INCOME_TRANSACTION.amount,
    note: DUMMY_INCOME_TRANSACTION.note,
    date: DUMMY_INCOME_TRANSACTION.date,
  };

  if (!existingIncome) {
    await knex("transactions").insert(incomePayload);
  } else {
    await knex("transactions")
      .where({ id: existingIncome.id })
      .update(incomePayload);
  }

  for (const transaction of DUMMY_TRANSACTIONS) {
    const existing = await knex("transactions")
      .where({
        user_id: userId,
        note: transaction.note,
      })
      .first();

    const payload = {
      user_id: userId,
      category_id: expenseCategoryId,
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
  const user = await ensureDummyUser(knex);
  const expenseCategory = await ensureCategory(knex, user.id, "Makanan", "expense");
  const incomeCategory = await ensureCategory(knex, user.id, "Gaji", "income");
  
  const budgetPeriod = await ensureDummyBudgetPeriod(
    knex,
    user.id,
    expenseCategory.id,
  );

  await upsertDummyTransactions(
    knex,
    user.id,
    expenseCategory.id,
    incomeCategory.id,
    budgetPeriod.id,
  );
};
