const DEFAULT_CATEGORIES = [
  { name: "Gaji", type: "income" },
  { name: "Makanan", type: "expense" },
  { name: "Transportasi", type: "expense" },
  { name: "Hiburan", type: "expense" },
  { name: "Lainnya", type: "expense" },
];

exports.seed = async function seed(knex) {
  for (const category of DEFAULT_CATEGORIES) {
    const existing = await knex("categories")
      .where({ name: category.name })
      .first();

    if (!existing) {
      await knex("categories").insert(category);
    }
  }
};
