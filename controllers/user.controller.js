const { supabase } = require('../db/dbConfig');

module.exports.login = async (req, res) => {
	const { email } = req.body;

	console.log(req.body);
	const { data, error } = await supabase.from('Users').select().eq('email', email);
	res.status(200).json({ result: data, error });
};

module.exports.getAllUsers = async (req, res) => {
	let { data: Users, error } = await supabase.from('Users').select('*');

	if (Users) {
		res.status(200).json({ result: Users });
	} else if (error) {
		res.status(500).json({ error });
	}
};
