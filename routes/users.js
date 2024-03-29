const express = require('express');
const {
    login,
    getAllUsers,
    createSession,
    generateClientSecret,
    getCompletePaymentInfo,
    getDataFromDatabase,
    registerUser,
    addItem,
    decreaseTest,
    stats,
    ccavenueInitiate,
    saveTemporaryUsers,
    getMailingList,
    paymentStatus,
    sendSequentialMail,
    saveDataInRedis
} = require('../controllers/user.controller');
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
router.get('/getStats', stats);
router.get('/initiate', ccavenueInitiate);
router.post('/saveTemp', saveTemporaryUsers);
router.get('/getMailingList', getMailingList);
router.post('/payment_status', paymentStatus);
router.post('/sendMailManual', sendSequentialMail);
router.post('/saveDataInRedis', saveDataInRedis);

module.exports = router;
