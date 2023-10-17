const express = require('express');
const { login, getAllUsers, createSession, generateClientSecret, getCompletePaymentInfo, getDataFromDatabase, registerUser, addItem, decreaseTest } = require('../controllers/user.controller');
var router = express.Router();

/* GET users listing. */
router.post('/login', login);
router.get('/getAllUsers', getAllUsers);
router.post('/checkout', createSession);
router.post('/getSecret', generateClientSecret);
router.get('/getPaymentData', getCompletePaymentInfo);
router.get('/getData', getDataFromDatabase);
router.post('/registerUser', registerUser);
router.post('/addItem', addItem);
router.post('/decrease', decreaseTest);

module.exports = router;
