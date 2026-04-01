exports.up = async function up(knex) {
  // Kept for migration history compatibility.
  // Default data seeding has moved to seeders.
  return knex;
};

exports.down = async function down(knex) {
  return knex;
};
