exports.up = async function up(knex) {
  await knex.schema.alterTable("users", (table) => {
    table.string("password", 255).nullable().alter();
    table.string("firebase_uid", 191).nullable().unique();
    table.string("auth_provider", 20).notNullable().defaultTo("local");
  });

  await knex("users").whereNull("auth_provider").update({
    auth_provider: "local",
  });
};

exports.down = async function down(knex) {
  await knex("users")
    .whereNull("password")
    .update({ password: "__GOOGLE_ACCOUNT_NO_PASSWORD__" });

  await knex.schema.alterTable("users", (table) => {
    table.dropUnique(["firebase_uid"]);
    table.dropColumn("firebase_uid");
    table.dropColumn("auth_provider");
  });

  await knex.schema.alterTable("users", (table) => {
    table.string("password", 255).notNullable().alter();
  });
};
