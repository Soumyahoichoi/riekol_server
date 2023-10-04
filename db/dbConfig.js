const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

module.exports.supabase = createClient(
	process.env.SUPABASE_REST_URI,
	process.env.SUPABASE_SERVICE_ROLE_API_KEY
);
