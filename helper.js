const nodemailer = require('nodemailer');

module.exports.returnUrl = () => {
    if (process.env.NODE_ENV === 'production') {
        return 'https://riekol-ui.vercel.app';
    } else {
        return 'http://localhost:5173';

        //give vercel hosted url here
        // return 'https://strapi-portfolio-2021.herokuapp.com'
    }
};

module.exports.EVENTS = [
    'MyEO Culture & Cuisine',

    'MyEO Hare Krishna',

    'MyEO Golf Tournament',

    'MyEO Learning with Amartya Sen',

    'MyEO Jute mill visit & Zamindari Lunch',

    'Test',

    'MyEO Food Crawl',

    'MyEO Eden Gardens',

    'MyEO Tea Tales',

    'MyEO Born in a brothel',

    'MyEO Ganga Aarti with Shikara ride'
];

module.exports.transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: 'info@riekol.com', // generated brevo user
        pass: 'xsmtpsib-7230c6492975cbdc72c438bc69c4ac6cbb7cb6d3d5111558e5aa3a7639998951-rEdUxabwkLz7g91K' // generated brevo password
    }
});
