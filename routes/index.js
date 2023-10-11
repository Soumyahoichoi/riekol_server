const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

//
const generateNewPool = () => {
	return new Pool({
		user: 'postgres',
		host: 'db.kmzribvpzlhzpzlfvvml.supabase.co',
		database: 'postgres',
		password: 'zJwfctd8ihxPF3gO',
		port: 5432
	});
};

// TO send all the data from the database
router.get('/api/data', async (req, res, next) => {
	const pool = generateNewPool();
	const response = await pool.query('SELECT * FROM my_eo_website_format');
	const responseData = response.rows;
	pool.end();
	res.send(responseData);
});

/* GET home page. */
router.get('/', function (req, res, next) {
	res.send('Hello there ');
});

module.exports = router;
