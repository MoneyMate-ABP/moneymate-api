exports.up = async function up(knex) {
  await knex.schema.createTable("notification_histories", (table) => {
    table.increments("id").primary();
    table.integer("user_id").unsigned().notNullable();
    table.string("title", 255).notNullable();
    table.text("body").notNullable();
    table.string("budget_period_name", 255).nullable();
    table.decimal("effective_budget", 14, 2).notNullable();
    table.decimal("carry_over", 14, 2).notNullable();
    table.boolean("is_read").notNullable().defaultTo(false);
    table.timestamp("sent_at").notNullable().defaultTo(knex.fn.now());

    table.foreign("user_id").references("users.id").onDelete("CASCADE");
    table.index(["user_id", "sent_at"]);
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("notification_histories");
};
