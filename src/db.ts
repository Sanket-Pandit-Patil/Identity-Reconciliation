// src/db.ts
import knex from "knex";
const config = require("../knexfile");   // ✅ CommonJS require for knexfile.js

const env = process.env.NODE_ENV || "development";
const cfg = config[env];

const db = knex(cfg);
export default db;