const db = require("../config/db");

async function listCategories(req, res) {
  const categories = await db("categories")
    .select("id", "name", "type")
    .orderBy("id", "asc");

  return res.json({
    data: categories,
  });
}

module.exports = {
  listCategories,
};
