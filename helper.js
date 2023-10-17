module.exports.returnUrl = () => {
    if (import.meta.env.PROD) {
        return 'https://riekol-ui.vercel.app';
    } else {
        return 'http://localhost:5173';

        //give vercel hosted url here
        // return 'https://strapi-portfolio-2021.herokuapp.com'
    }
};
