var express = require('express');
const { login, getAllUsers } = require('../controllers/user.controller');
var router = express.Router();

/* GET users listing. */
router.post('/login', login);
router.get('/getAllUsers', getAllUsers);

module.exports = router;
