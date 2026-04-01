exports.up = async function up(knex) {
  await knex.schema.createTable("users", (table) => {
    table.increments("id").primary();
    table.string("name", 150).notNullable();
    table.string("email", 190).notNullable().unique();
    table.string("password", 255).notNullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("categories", (table) => {
    table.increments("id").primary();
    table.string("name", 100).notNullable().unique();
    table.string("type", 20).notNullable().defaultTo("expense");
  });

  await knex.schema.createTable("budget_periods", (table) => {
    table.increments("id").primary();
    table.integer("user_id").unsigned().notNullable();
    table.integer("category_id").unsigned().nullable();
    table.string("name", 150).notNullable();
    table.decimal("total_budget", 14, 2).notNullable();
    table.date("start_date").notNullable();
    table.date("end_date").notNullable();
    table.decimal("daily_budget_base", 14, 2).notNullable();
    table.integer("working_days_count").notNullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    table.foreign("user_id").references("users.id").onDelete("CASCADE");
    table
      .foreign("category_id")
      .references("categories.id")
      .onDelete("SET NULL");
  });

  await knex.schema.createTable("transactions", (table) => {
    table.increments("id").primary();
    table.integer("user_id").unsigned().notNullable();
    table.integer("category_id").unsigned().notNullable();
    table.integer("budget_period_id").unsigned().nullable();
    table.string("type", 20).notNullable();
    table.decimal("amount", 14, 2).notNullable();
    table.text("note").nullable();
    table.date("date").notNullable();
    table.decimal("latitude", 10, 7).nullable();
    table.decimal("longitude", 10, 7).nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    table.foreign("user_id").references("users.id").onDelete("CASCADE");
    table
      .foreign("category_id")
      .references("categories.id")
      .onDelete("RESTRICT");
    table
      .foreign("budget_period_id")
      .references("budget_periods.id")
      .onDelete("SET NULL");
    table.index(["user_id", "date"]);
  });

  await knex.schema.createTable("revoked_tokens", (table) => {
    table.increments("id").primary();
    table.integer("user_id").unsigned().notNullable();
    table.string("token", 512).notNullable().unique();
    table.timestamp("expires_at").nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    table.foreign("user_id").references("users.id").onDelete("CASCADE");
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("revoked_tokens");
  await knex.schema.dropTableIfExists("transactions");
  await knex.schema.dropTableIfExists("budget_periods");
  await knex.schema.dropTableIfExists("categories");
  await knex.schema.dropTableIfExists("users");
};
