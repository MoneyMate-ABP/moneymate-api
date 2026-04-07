const { z } = require("zod");
const db = require("../config/db");
const { extractInsertedId } = require("../utils/db");

const categoryType = z.enum(["income", "expense", "both"]);

const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  type: categoryType.optional().default("expense"),
});

const updateCategorySchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    type: categoryType.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required to update category.",
  });

const categoryIdSchema = z.coerce.number().int().positive();

function parseCategoryId(value) {
  return categoryIdSchema.parse(value);
}

async function listCategories(req, res) {
  const categories = await db("categories")
    .select("id", "name", "type")
    .where({ user_id: req.user.id })
    .orderBy("id", "asc");

  return res.json({
    data: categories,
  });
}

async function createCategory(req, res) {
  const payload = createCategorySchema.parse(req.body);

  const existingCategory = await db("categories")
    .where({ user_id: req.user.id })
    .whereRaw("LOWER(name) = LOWER(?)", [payload.name])
    .first();

  if (existingCategory) {
    return res.status(409).json({ message: "Category name already exists." });
  }

  const insertResult = await db("categories")
    .insert({
      user_id: req.user.id,
      name: payload.name,
      type: payload.type,
    })
    .returning("id");

  const insertedId = extractInsertedId(insertResult);
  const createdCategory = insertedId
    ? await db("categories").where({ id: insertedId }).first()
    : null;

  return res.status(201).json({
    message: "Category created.",
    data: createdCategory,
  });
}

async function updateCategory(req, res) {
  const categoryId = parseCategoryId(req.params.id);
  const payload = updateCategorySchema.parse(req.body);

  const existingCategory = await db("categories")
    .where({ id: categoryId, user_id: req.user.id })
    .first();

  if (!existingCategory) {
    return res.status(404).json({ message: "Category not found." });
  }

  if (payload.name) {
    const duplicateName = await db("categories")
      .where({ user_id: req.user.id })
      .whereRaw("LOWER(name) = LOWER(?)", [payload.name])
      .whereNot({ id: categoryId })
      .first();

    if (duplicateName) {
      return res.status(409).json({ message: "Category name already exists." });
    }
  }

  await db("categories").where({ id: categoryId }).update(payload);

  const updatedCategory = await db("categories")
    .where({ id: categoryId })
    .first();

  return res.json({
    message: "Category updated.",
    data: updatedCategory,
  });
}

async function deleteCategory(req, res) {
  const categoryId = parseCategoryId(req.params.id);

  const existingCategory = await db("categories")
    .where({ id: categoryId, user_id: req.user.id })
    .first();

  if (!existingCategory) {
    return res.status(404).json({ message: "Category not found." });
  }

  const linkedTransaction = await db("transactions")
    .where({ category_id: categoryId })
    .first();

  if (linkedTransaction) {
    return res.status(409).json({
      message: "Category is used by transactions and cannot be deleted.",
    });
  }

  await db("categories").where({ id: categoryId }).delete();

  return res.json({ message: "Category deleted." });
}

module.exports = {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
};
