const { startOfToday } = require("date-fns");
const { z } = require("zod");
const db = require("../config/db");
const { extractInsertedId } = require("../utils/db");
const {
  normalizeDateString,
  parseDate,
  toDateString,
} = require("../utils/date");
const { toNumber } = require("../utils/number");
const { buildPaginationMeta, parsePagination } = require("../utils/pagination");
const {
  BUDGET_SYSTEMS,
  calculateDailyBudgetBase,
  getBudgetPeriodById,
  getDailyStatus,
  getWorkingDaysCount,
  normalizeBudgetSystem,
  normalizeExcludedWeekdays,
  parseExcludedWeekdays,
} = require("../services/budgetService");

const excludedWeekdaysSchema = z.array(z.coerce.number().int().min(0).max(6));
const budgetSystemSchema = z.enum([
  BUDGET_SYSTEMS.CARRY_OVER,
  BUDGET_SYSTEMS.INVEST,
  BUDGET_SYSTEMS.NOTHING,
]);

const createBudgetPeriodSchema = z.object({
  category_id: z.coerce.number().int().positive().nullable().optional(),
  name: z.string().trim().min(1).max(150),
  total_budget: z.coerce.number().positive(),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  excluded_weekdays: excludedWeekdaysSchema.optional().default([0, 6]),
  budget_system: budgetSystemSchema.optional().default(BUDGET_SYSTEMS.NOTHING),
  is_default: z.boolean().optional().default(false),
});

const updateBudgetPeriodSchema = z
  .object({
    category_id: z.coerce.number().int().positive().nullable().optional(),
    name: z.string().trim().min(1).max(150).optional(),
    total_budget: z.coerce.number().positive().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    excluded_weekdays: excludedWeekdaysSchema.optional(),
    budget_system: budgetSystemSchema.optional(),
    is_default: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required to update budget period.",
  });

function parseBudgetPeriodId(value) {
  const parsedId = Number(value);

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    const error = new Error("Budget period id must be a positive integer.");
    error.statusCode = 400;
    throw error;
  }

  return parsedId;
}

function toBudgetPeriodResponse(period) {
  return {
    ...period,
    total_budget: toNumber(period.total_budget),
    daily_budget_base: toNumber(period.daily_budget_base),
    start_date: normalizeDateString(period.start_date, "start_date"),
    end_date: normalizeDateString(period.end_date, "end_date"),
    excluded_weekdays: parseExcludedWeekdays(period.excluded_weekdays),
    budget_system: normalizeBudgetSystem(period.budget_system),
    is_default: Boolean(period.is_default),
  };
}

async function hasDefaultBudgetPeriod(userId) {
  const row = await db("budget_periods")
    .where({ user_id: userId, is_default: true })
    .first();

  return Boolean(row);
}

async function setDefaultBudgetPeriodInTransaction(
  trx,
  userId,
  budgetPeriodId,
) {
  await trx("budget_periods")
    .where({ user_id: userId, is_default: true })
    .update({ is_default: false });

  await trx("budget_periods")
    .where({ id: budgetPeriodId, user_id: userId })
    .update({ is_default: true });
}

async function ensureCategoryExists(categoryId) {
  if (!categoryId) return;

  const category = await db("categories").where({ id: categoryId }).first();
  if (!category) {
    const error = new Error("Category not found.");
    error.statusCode = 404;
    throw error;
  }
}

function ensureDateRange(startDate, endDate) {
  if (startDate > endDate) {
    const error = new Error("start_date cannot be greater than end_date.");
    error.statusCode = 400;
    throw error;
  }
}

async function listBudgetPeriods(req, res) {
  const pagination = parsePagination(req.query);

  const query = db("budget_periods")
    .leftJoin("categories", "budget_periods.category_id", "categories.id")
    .select(
      "budget_periods.*",
      "categories.name as category_name",
      "categories.type as category_type",
    )
    .where("budget_periods.user_id", req.user.id)
    .orderBy("budget_periods.is_default", "desc")
    .orderBy("budget_periods.created_at", "desc");

  if (pagination) {
    query.limit(pagination.limit).offset(pagination.offset);
  }

  const budgetPeriods = await query;
  const data = budgetPeriods.map(toBudgetPeriodResponse);

  if (!pagination) {
    return res.json({ data });
  }

  const [{ total }] = await db("budget_periods")
    .where("user_id", req.user.id)
    .count({ total: "id" });

  const meta = buildPaginationMeta({
    page: pagination.page,
    limit: pagination.limit,
    total: Number(total),
  });

  return res.json({
    data,
    meta,
  });
}

async function createBudgetPeriod(req, res) {
  const payload = createBudgetPeriodSchema.parse(req.body);
  const startDate = parseDate(payload.start_date, "start_date");
  const endDate = parseDate(payload.end_date, "end_date");

  ensureDateRange(startDate, endDate);
  await ensureCategoryExists(payload.category_id);

  const excludedWeekdays = normalizeExcludedWeekdays(payload.excluded_weekdays);
  const budgetSystem = normalizeBudgetSystem(payload.budget_system);

  const workingDaysCount = getWorkingDaysCount(
    startDate,
    endDate,
    excludedWeekdays,
  );
  const dailyBudgetBase = calculateDailyBudgetBase(
    payload.total_budget,
    workingDaysCount,
  );

  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  const duplicate = await db("budget_periods")
    .where({
      user_id: req.user.id,
      name: payload.name,
      total_budget: payload.total_budget,
      start_date: toDateString(startDate),
      end_date: toDateString(endDate),
    })
    .where("created_at", ">", oneMinuteAgo)
    .first();

  if (duplicate) {
    return res.status(409).json({ message: "Duplicate budget period detected. Please wait a moment before submitting identical ones." });
  }

  const existingDefault = await hasDefaultBudgetPeriod(req.user.id);
  const shouldSetDefault = payload.is_default || !existingDefault;


  const insertResult = await db.transaction(async (trx) => {
    if (shouldSetDefault) {
      await trx("budget_periods")
        .where({ user_id: req.user.id, is_default: true })
        .update({ is_default: false });
    }

    return trx("budget_periods")
      .insert({
        user_id: req.user.id,
        category_id: payload.category_id ?? null,
        name: payload.name,
        total_budget: payload.total_budget,
        start_date: toDateString(startDate),
        end_date: toDateString(endDate),
        daily_budget_base: dailyBudgetBase,
        working_days_count: workingDaysCount,
        excluded_weekdays: JSON.stringify(excludedWeekdays),
        budget_system: budgetSystem,
        is_default: shouldSetDefault,
      })
      .returning("id");
  });

  const insertedId = extractInsertedId(insertResult);
  const createdPeriod = insertedId
    ? await db("budget_periods")
        .where({ id: insertedId, user_id: req.user.id })
        .first()
    : null;

  return res.status(201).json({
    message: "Budget period created.",
    data: createdPeriod ? toBudgetPeriodResponse(createdPeriod) : null,
  });
}

async function updateBudgetPeriod(req, res) {
  const budgetPeriodId = parseBudgetPeriodId(req.params.id);
  const payload = updateBudgetPeriodSchema.parse(req.body);

  const budgetPeriod = await getBudgetPeriodById(req.user.id, budgetPeriodId);
  if (!budgetPeriod) {
    return res.status(404).json({ message: "Budget period not found." });
  }

  const nextName = payload.name ?? budgetPeriod.name;
  const nextCategoryId =
    typeof payload.category_id !== "undefined"
      ? payload.category_id
      : budgetPeriod.category_id;

  await ensureCategoryExists(nextCategoryId);

  const nextTotalBudget =
    typeof payload.total_budget !== "undefined"
      ? payload.total_budget
      : toNumber(budgetPeriod.total_budget);

  const nextStartDate =
    typeof payload.start_date !== "undefined"
      ? parseDate(payload.start_date, "start_date")
      : parseDate(budgetPeriod.start_date, "start_date");

  const nextEndDate =
    typeof payload.end_date !== "undefined"
      ? parseDate(payload.end_date, "end_date")
      : parseDate(budgetPeriod.end_date, "end_date");

  const nextExcludedWeekdays =
    typeof payload.excluded_weekdays !== "undefined"
      ? normalizeExcludedWeekdays(payload.excluded_weekdays)
      : parseExcludedWeekdays(budgetPeriod.excluded_weekdays);

  const nextBudgetSystem =
    typeof payload.budget_system !== "undefined"
      ? normalizeBudgetSystem(payload.budget_system)
      : normalizeBudgetSystem(budgetPeriod.budget_system);

  ensureDateRange(nextStartDate, nextEndDate);

  const workingDaysCount = getWorkingDaysCount(
    nextStartDate,
    nextEndDate,
    nextExcludedWeekdays,
  );
  const dailyBudgetBase = calculateDailyBudgetBase(
    nextTotalBudget,
    workingDaysCount,
  );

  if (payload.is_default === false && budgetPeriod.is_default) {
    return res.status(400).json({
      message:
        "Cannot unset current default directly. Set another budget period as default first.",
    });
  }

  const shouldSetDefault = payload.is_default === true;

  await db.transaction(async (trx) => {
    if (shouldSetDefault) {
      await setDefaultBudgetPeriodInTransaction(
        trx,
        req.user.id,
        budgetPeriodId,
      );
    }

    await trx("budget_periods")
      .where({ id: budgetPeriodId, user_id: req.user.id })
      .update({
        name: nextName,
        category_id: nextCategoryId,
        total_budget: nextTotalBudget,
        start_date: toDateString(nextStartDate),
        end_date: toDateString(nextEndDate),
        daily_budget_base: dailyBudgetBase,
        working_days_count: workingDaysCount,
        excluded_weekdays: JSON.stringify(nextExcludedWeekdays),
        budget_system: nextBudgetSystem,
        is_default: shouldSetDefault ? true : Boolean(budgetPeriod.is_default),
      });
  });

  const updatedPeriod = await getBudgetPeriodById(req.user.id, budgetPeriodId);

  return res.json({
    message: "Budget period updated.",
    data: toBudgetPeriodResponse(updatedPeriod),
  });
}

async function deleteBudgetPeriod(req, res) {
  const budgetPeriodId = parseBudgetPeriodId(req.params.id);

  const budgetPeriod = await getBudgetPeriodById(req.user.id, budgetPeriodId);
  if (!budgetPeriod) {
    return res.status(404).json({ message: "Budget period not found." });
  }

  if (budgetPeriod.is_default) {
    const replacement = await db("budget_periods")
      .where("user_id", req.user.id)
      .whereNot("id", budgetPeriodId)
      .orderBy("created_at", "desc")
      .first();

    if (!replacement) {
      return res.status(400).json({
        message:
          "Cannot delete the only default budget period. Create another period first.",
      });
    }

    await db.transaction(async (trx) => {
      await trx("budget_periods")
        .where({ id: budgetPeriodId, user_id: req.user.id })
        .delete();

      await setDefaultBudgetPeriodInTransaction(
        trx,
        req.user.id,
        replacement.id,
      );
    });

    return res.json({
      message:
        "Budget period deleted. Default period switched to the latest one.",
    });
  }

  const affectedRows = await db("budget_periods")
    .where({ id: budgetPeriodId, user_id: req.user.id })
    .delete();

  if (!affectedRows) {
    return res.status(404).json({ message: "Budget period not found." });
  }

  return res.json({ message: "Budget period deleted." });
}

async function setDefaultBudgetPeriod(req, res) {
  const budgetPeriodId = parseBudgetPeriodId(req.params.id);

  const budgetPeriod = await getBudgetPeriodById(req.user.id, budgetPeriodId);
  if (!budgetPeriod) {
    return res.status(404).json({ message: "Budget period not found." });
  }

  await db.transaction(async (trx) => {
    await setDefaultBudgetPeriodInTransaction(trx, req.user.id, budgetPeriodId);
  });

  const updatedPeriod = await getBudgetPeriodById(req.user.id, budgetPeriodId);

  return res.json({
    message: "Default budget period updated.",
    data: toBudgetPeriodResponse(updatedPeriod),
  });
}

async function getBudgetDailyStatus(req, res) {
  const budgetPeriodId = Number(req.params.id);
  const date = req.query.date
    ? parseDate(req.query.date, "date")
    : startOfToday();

  const budgetPeriod = await getBudgetPeriodById(req.user.id, budgetPeriodId);
  if (!budgetPeriod) {
    return res.status(404).json({ message: "Budget period not found." });
  }

  const data = await getDailyStatus(budgetPeriod, date);

  return res.json({ data });
}

module.exports = {
  createBudgetPeriod,
  deleteBudgetPeriod,
  getBudgetDailyStatus,
  listBudgetPeriods,
  setDefaultBudgetPeriod,
  updateBudgetPeriod,
};
