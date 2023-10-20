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
