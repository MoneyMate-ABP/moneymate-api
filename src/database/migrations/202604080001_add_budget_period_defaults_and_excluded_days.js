exports.up = async function up(knex) {
  await knex.schema.alterTable("budget_periods", (table) => {
    table.boolean("is_default").notNullable().defaultTo(false);
    table.text("excluded_weekdays").notNullable().defaultTo("[0,6]");
  });
};

exports.down = async function down(knex) {
  await knex.schema.alterTable("budget_periods", (table) => {
    table.dropColumn("excluded_weekdays");
    table.dropColumn("is_default");
  });
};
