const express = require("express");
const {
  login,
  getAllUsers,
  createSession,
} = require("../controllers/user.controller");
var router = express.Router();

/* GET users listing. */
router.post("/login", login);
router.get("/getAllUsers", getAllUsers);
router.post("/checkout", createSession);

module.exports = router;
