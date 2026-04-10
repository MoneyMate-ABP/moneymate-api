exports.up = async function up(knex) {
  await knex.schema.createTable("push_subscriptions", (table) => {
    table.increments("id").primary();
    table.integer("user_id").unsigned().notNullable();
    table.string("endpoint", 512).notNullable();
    table.string("p256dh", 255).notNullable();
    table.string("auth", 255).notNullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    table.foreign("user_id").references("users.id").onDelete("CASCADE");
    table.unique(["user_id", "endpoint"]);
    table.index(["user_id"]);
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("push_subscriptions");
};
