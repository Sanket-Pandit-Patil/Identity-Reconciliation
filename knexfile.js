// knexfile.js
module.exports = {
  development: {
    client: "sqlite3",
    connection: { filename: "./dev.sqlite3" },
    useNullAsDefault: true,
    migrations: { directory: "./migrations" }
  },

  production: {
    client: "pg",
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    },
    migrations: { directory: "./migrations" },
    pool: { min: 0, max: 10 }
  }
};