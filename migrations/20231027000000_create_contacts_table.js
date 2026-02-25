exports.up = async function (knex) {
  await knex.schema.createTable("Contact", (table) => {
    table.increments("id").primary();
    table.string("phoneNumber").nullable();
    table.string("email").nullable();
    table.integer("linkedId").nullable();
    table.enu("linkPrecedence", ["primary", "secondary"]).notNullable();
    table.timestamp("createdAt").defaultTo(knex.fn.now());
    table.timestamp("updatedAt").defaultTo(knex.fn.now());
    table.timestamp("deletedAt").nullable();
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("Contact");
};