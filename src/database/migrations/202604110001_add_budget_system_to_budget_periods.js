exports.up = async function up(knex) {
  await knex.schema.alterTable("budget_periods", (table) => {
    table.string("budget_system", 20).notNullable().defaultTo("nothing");
  });

  await knex("budget_periods")
    .whereNull("budget_system")
    .update({ budget_system: "nothing" });
};

exports.down = async function down(knex) {
  await knex.schema.alterTable("budget_periods", (table) => {
    table.dropColumn("budget_system");
  });
};
