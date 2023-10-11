const express = require("express");
const {
  login,
  getAllUsers,
  createSession,
  generateClientSecret,
  getCompletePaymentInfo,
} = require("../controllers/user.controller");
var router = express.Router();

/* GET users listing. */
router.post("/login", login);
router.get("/getAllUsers", getAllUsers);
router.post("/checkout", createSession);
router.post("/getSecret", generateClientSecret);
router.get("/getPaymentData", getCompletePaymentInfo);

module.exports = router;
