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

const transactionType = z.enum(["income", "expense"]);

const createTransactionSchema = z.object({
  category_id: z.coerce.number().int().positive(),
  budget_period_id: z.coerce.number().int().positive().nullable().optional(),
  type: transactionType,
  amount: z.coerce.number().positive(),
  note: z.string().max(1000).optional().nullable(),
  date: z.string().min(1),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
});

const updateTransactionSchema = z
  .object({
    category_id: z.coerce.number().int().positive().optional(),
    budget_period_id: z.coerce.number().int().positive().nullable().optional(),
    type: transactionType.optional(),
    amount: z.coerce.number().positive().optional(),
    note: z.string().max(1000).optional().nullable(),
    date: z.string().optional(),
    latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
    longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required to update transaction.",
  });

async function ensureCategoryExists(categoryId) {
  const category = await db("categories").where({ id: categoryId }).first();
  if (!category) {
    const error = new Error("Category not found.");
    error.statusCode = 404;
    throw error;
  }
}

async function ensureBudgetPeriodForUser(userId, budgetPeriodId) {
  if (!budgetPeriodId) return;

  const period = await db("budget_periods")
    .where({ id: budgetPeriodId, user_id: userId })
    .first();

  if (!period) {
    const error = new Error("Budget period not found.");
    error.statusCode = 404;
    throw error;
  }
}

async function getDefaultBudgetPeriodIdForUser(userId) {
  const period = await db("budget_periods")
    .select("id")
    .where({ user_id: userId, is_default: true })
    .orderBy("created_at", "desc")
    .first();

  return period ? period.id : null;
}

async function listTransactions(req, res) {
  const { date, type, category } = req.query;
  const pagination = parsePagination(req.query);

  const query = db("transactions as t")
    .leftJoin("categories as c", "t.category_id", "c.id")
    .leftJoin("budget_periods as bp", "t.budget_period_id", "bp.id")
    .select(
      "t.id",
      "t.user_id",
      "t.category_id",
      "t.budget_period_id",
      "t.type",
      "t.amount",
      "t.note",
      "t.date",
      "t.latitude",
      "t.longitude",
      "t.created_at",
      "c.name as category_name",
      "bp.name as budget_period_name",
    )
    .where("t.user_id", req.user.id)
    .orderBy("t.date", "desc")
    .orderBy("t.id", "desc");

  if (date) {
    const parsedDate = parseDate(date, "date");
    query.andWhere("t.date", toDateString(parsedDate));
  }

  if (type) {
    transactionType.parse(type);
    query.andWhere("t.type", type);
  }

  if (category) {
    query.andWhere("t.category_id", Number(category));
  }

  if (pagination) {
    query.limit(pagination.limit).offset(pagination.offset);
  }

  const rows = await query;

  const data = rows.map((row) => ({
    ...row,
    amount: toNumber(row.amount),
    latitude: row.latitude === null ? null : toNumber(row.latitude),
    longitude: row.longitude === null ? null : toNumber(row.longitude),
    date: normalizeDateString(row.date),
  }));

  if (!pagination) {
    return res.json({ data });
  }

  const countQuery = db("transactions as t")
    .where("t.user_id", req.user.id)
    .count({ total: "t.id" });

  if (date) {
    const parsedDate = parseDate(date, "date");
    countQuery.andWhere("t.date", toDateString(parsedDate));
  }

  if (type) {
    countQuery.andWhere("t.type", type);
  }

  if (category) {
    countQuery.andWhere("t.category_id", Number(category));
  }

  const [{ total }] = await countQuery;
  const meta = buildPaginationMeta({
    page: pagination.page,
    limit: pagination.limit,
    total: Number(total),
  });

  return res.json({ data, meta });
}

async function getTransactionById(req, res) {
  const transactionId = Number(req.params.id);

  const row = await db("transactions as t")
    .leftJoin("categories as c", "t.category_id", "c.id")
    .leftJoin("budget_periods as bp", "t.budget_period_id", "bp.id")
    .select(
      "t.id",
      "t.user_id",
      "t.category_id",
      "t.budget_period_id",
      "t.type",
      "t.amount",
      "t.note",
      "t.date",
      "t.latitude",
      "t.longitude",
      "t.created_at",
      "c.name as category_name",
      "bp.name as budget_period_name",
    )
    .where("t.id", transactionId)
    .andWhere("t.user_id", req.user.id)
    .first();

  if (!row) {
    return res.status(404).json({ message: "Transaction not found." });
  }

  const data = {
    ...row,
    amount: toNumber(row.amount),
    latitude: row.latitude === null ? null : toNumber(row.latitude),
    longitude: row.longitude === null ? null : toNumber(row.longitude),
    date: normalizeDateString(row.date),
  };

  return res.json({ data });
}

async function createTransaction(req, res) {
  const payload = createTransactionSchema.parse(req.body);
  const transactionDate = parseDate(payload.date, "date");
  const shouldUseDefaultBudgetPeriod =
    typeof payload.budget_period_id === "undefined";

  const resolvedBudgetPeriodId = shouldUseDefaultBudgetPeriod
    ? await getDefaultBudgetPeriodIdForUser(req.user.id)
    : payload.budget_period_id;

  await ensureCategoryExists(payload.category_id);
  await ensureBudgetPeriodForUser(req.user.id, resolvedBudgetPeriodId);

  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  const duplicate = await db("transactions")
    .where({
      user_id: req.user.id,
      category_id: payload.category_id,
      type: payload.type,
      amount: payload.amount,
      date: toDateString(transactionDate),
    })
    .where("created_at", ">", oneMinuteAgo)
    .first();

  if (duplicate) {
    return res.status(409).json({ message: "Duplicate transaction detected. Please wait a moment before submitting identical transactions." });
  }

  const insertResult = await db("transactions")
    .insert({
      user_id: req.user.id,
      category_id: payload.category_id,
      budget_period_id: resolvedBudgetPeriodId ?? null,
      type: payload.type,
      amount: payload.amount,
      note: payload.note ?? null,
      date: toDateString(transactionDate),
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
    })
    .returning("id");

  const insertedId = extractInsertedId(insertResult);
  const createdTransaction = insertedId
    ? await db("transactions")
        .where({ id: insertedId, user_id: req.user.id })
        .first()
    : null;

  return res.status(201).json({
    message: "Transaction created.",
    data: createdTransaction || null,
  });
}

async function updateTransaction(req, res) {
  const transactionId = Number(req.params.id);
  const payload = updateTransactionSchema.parse(req.body);

  const existingTransaction = await db("transactions")
    .where({ id: transactionId, user_id: req.user.id })
    .first();

  if (!existingTransaction) {
    return res.status(404).json({ message: "Transaction not found." });
  }

  if (payload.category_id) {
    await ensureCategoryExists(payload.category_id);
  }

  if (typeof payload.budget_period_id !== "undefined") {
    await ensureBudgetPeriodForUser(req.user.id, payload.budget_period_id);
  }

  const updates = {
    ...payload,
  };

  if (payload.date) {
    updates.date = toDateString(parseDate(payload.date, "date"));
  }

  await db("transactions")
    .where({ id: transactionId, user_id: req.user.id })
    .update(updates);

  const updatedTransaction = await db("transactions")
    .where({ id: transactionId, user_id: req.user.id })
    .first();

  return res.json({
    message: "Transaction updated.",
    data: updatedTransaction,
  });
}

async function deleteTransaction(req, res) {
  const transactionId = Number(req.params.id);

  const affectedRows = await db("transactions")
    .where({ id: transactionId, user_id: req.user.id })
    .delete();

  if (!affectedRows) {
    return res.status(404).json({ message: "Transaction not found." });
  }

  return res.json({ message: "Transaction deleted." });
}

module.exports = {
  createTransaction,
  deleteTransaction,
  getTransactionById,
  listTransactions,
  updateTransaction,
};
