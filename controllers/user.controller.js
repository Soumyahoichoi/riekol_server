const { supabase } = require("../db/dbConfig");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { generateNewPool } = require("../db/dbConfig");

const pool = generateNewPool();

const generatePaymentIntent = async (amount) => {
  return await stripe.paymentIntents.create({
    amount: +amount,
    currency: "inr",
    payment_method_types: ["card"],
    automatic_payment_methods: {
      enabled: false,
    },
  });
};

module.exports.login = async (req, res) => {
  const { email } = req.body;

  const { data, error } = await supabase
    .from("Users")
    .select()
    .eq("email", email);
  res.status(200).json({ result: data.length === 1, error });
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
  const cartValues = req.body;
  const line_items = cartValues?.map((item) => ({
    price: item.price_id,
    quantity: item.count,
  }));

  if (line_items) {
    const url =
      process.env.NODE_ENV === "production"
        ? "https://riekol-ui.vercel.app"
        : "http://localhost:5173";
    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: "payment",
      success_url: `${url}/thankyou`,
      cancel_url: `${url}/thankyou`,
    });
    res.status(200).json({ result: session.url });
  } else {
    res.status(400).json({ result: "Bad Request" });
  }
};

module.exports.generateClientSecret = async (req, res) => {
  if (req.body.amount > 0) {
    const paymentIntent = await generatePaymentIntent(req.body.amount);
    res.json({ result: paymentIntent.client_secret });
  } else {
    res.status(400).json({ result: "Bad Request" });
  }
};

module.exports.getCompletePaymentInfo = async (req, res) => {
  const paymentIntents = await stripe.paymentIntents.list({
    limit: 100,
  });

  res.status(200).json({ result: paymentIntents });
};

// TO send all the data from the database
module.exports.getDataFromDatabase = async (req, res, next) => {
  if (pool) {
    const response = await pool.query("SELECT * FROM my_eo_website_format");
    const responseData = response.rows;
    pool.end();
    res.send(responseData);
  } else {
    res.status(500).json({ result: "Please try again after sometime" });
  }
};

module.exports.registerUser = async (req, res) => {
  const { ticketDetails } = req.body;

  if (ticketDetails) {
    try {
      const response = await supabase.from("purchases").insert(ticketDetails);
      const rpc = await supabase.rpc("decrement_seats", { row_id: 1 });
      res.status(200).json({ result: response });
    } catch (error) {
      res.status(500).json({ error });
    }
  } else {
    res.status(400).json({ error: "Bad Request" });
  }
};
