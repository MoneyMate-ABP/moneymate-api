exports.up = async function up(knex) {
  // Option A chosen: wipe existing data from categories
  // (which means dropping transactions and budget_periods depending on it if necessary, OR cascading)
  // Wait, transactions has: table.foreign("category_id").references("categories.id").onDelete("RESTRICT");
  // That means we CANNOT delete categories if transactions exist.
  // We must delete transactions first, then budget periods (which references categories), then categories.
  await knex("transactions").del();
  await knex("budget_periods").del();
  await knex("categories").del();

  await knex.schema.alterTable("categories", (table) => {
    // Add user_id column
    table.integer("user_id").unsigned().notNullable();
    table.foreign("user_id").references("users.id").onDelete("CASCADE");
    
    // Drop existing unique constraint on name (knex names it categories_name_unique)
    table.dropUnique("name");
    
    // Add composite unique constraint
    table.unique(["user_id", "name"]);
  });
};

exports.down = async function down(knex) {
  await knex.schema.alterTable("categories", (table) => {
    table.dropUnique(["user_id", "name"]);
    table.unique("name");
    
    table.dropForeign("user_id");
    table.dropColumn("user_id");
  });
};
