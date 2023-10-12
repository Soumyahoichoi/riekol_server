const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();
const { Pool } = require("pg");

module.exports.supabase = createClient(
  process.env.SUPABASE_REST_URI,
  process.env.SUPABASE_SERVICE_ROLE_API_KEY
);

//
module.exports.generateNewPool = () => {
  return new Pool({
    user: "postgres",
    host: "db.kmzribvpzlhzpzlfvvml.supabase.co",
    database: "postgres",
    password: process.env.PASSWORD,
    port: 5432,
  });
};
