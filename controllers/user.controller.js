const { supabase } = require("../db/dbConfig");

module.exports.login = async (req, res) => {
  res.status(200).json({ result: "working successfully" });
};

module.exports.getAllUsers = async (req, res) => {
  let { data: Users, error } = await supabase.from("Users").select("*");
  res.status(200).json({ result: Users });
};
