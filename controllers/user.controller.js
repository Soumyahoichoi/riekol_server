const { supabase } = require("../db/dbConfig");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports.login = async (req, res) => {
  const { email } = req.body;

  console.log(req.body);
  const { data, error } = await supabase
    .from("Users")
    .select()
    .eq("email", email);
  res.status(200).json({ result: data, error });
};

module.exports.getAllUsers = async (req, res) => {
  let { data: Users, error } = await supabase.from("Users").select("*");

  if (Users) {
    res.status(200).json({ result: Users });
  } else if (error) {
    res.status(500).json({ error });
  }
};

module.exports.createSession = async (req, res) => {
  const { cartValues } = req.body;
  const line_items = cartValues.map((item) => ({
    price: item.priceId,
    quantity: item.count,
  }));

  const session = await stripe.checkout.sessions.create({
    line_items,
    mode: "payment",
    success_url: `http://localhost:5173/deepdive`,
    cancel_url: `http://localhost:5173/deepdive`,
  });

  res.redirect(303, session.url);
};