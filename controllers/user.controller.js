const { supabase } = require('../db/dbConfig');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { generateNewPool } = require('../db/dbConfig');
const axios = require('axios');
const _ = require('lodash');
const { EVENTS } = require('./../helper');

const generatePaymentIntent = async (amount, currency, descriptor) => {
    return await stripe.paymentIntents.create({
        amount: +amount,
        currency: currency,
        payment_method_types: ['card'],
        automatic_payment_methods: {
            enabled: false
        },
        description: descriptor
    });
};

module.exports.login = async (req, res) => {
    const { email } = req.body;

    const { data, error } = await supabase.from('Users').select().eq('email', email);
    res.status(200).json({ result: data.length === 1, error });
};

module.exports.getAllUsers = async (req, res) => {
    let { data: Users, error } = await supabase.from('Users').select('*');

    if (Users) {
        res.status(200).json({ result: Users });
    } else if (error) {
        res.status(500).json({ error });
    }
};

module.exports.createSession = async (req, res) => {
    const cartValues = req.body;
    const line_items = cartValues?.map((item) => ({
        price: item.price_id,
        quantity: item.count
    }));

    if (line_items) {
        const url = process.env.NODE_ENV === 'production' ? 'https://riekol-ui.vercel.app' : 'http://localhost:5173';
        const session = await stripe.checkout.sessions.create({
            line_items,
            mode: 'payment',
            success_url: `${url}/thankyou`,
            cancel_url: `${url}/thankyou`
        });
        res.status(200).json({ result: session.url });
    } else {
        res.status(400).json({ result: 'Bad Request' });
    }
};

module.exports.generateClientSecret = async (req, res) => {
    if (req.body.amount > 0 && req.body.currency) {
        const paymentIntent = await generatePaymentIntent(req.body.amount, req.body.currency, req.body.descriptor);
        res.json({ result: paymentIntent.client_secret });
    } else {
        res.status(400).json({ result: 'Bad Request' });
    }
};

module.exports.getCompletePaymentInfo = async (req, res) => {
    const paymentIntents = await supabase.from('purchases').select('*');

    res.send(paymentIntents?.data);
};

// TO send all the data from the database
module.exports.getDataFromDatabase = async (req, res, next) => {
    try {
        const response = await supabase.from('my_eo_website_format').select('*');
        const responseData = response;
        res.send(responseData);
    } catch (error) {
        res.status(500).json({ error });
    }
};

module.exports.registerUser = async (req, res) => {
    const { ticketDetails } = req.body;

    if (ticketDetails) {
        try {
            const response = await supabase.from('purchases').insert(ticketDetails);
            const decrement = await supabase.rpc('decrement_seats', {
                event_name: ticketDetails.map((item) => item.name)
            });
            //airtable
            if (response?.status === 201 && decrement?.status === 204) {
                await axios.post(
                    'https://api.airtable.com/v0/app5mepjhCkn9Zojw/supabase_purchase_data',
                    {
                        records: [...ticketDetails.map((item) => ({ fields: { ...item } }))]
                    },
                    {
                        headers: {
                            Authorization: `Bearer patJLEWwnFANu0Mwv.c98aeb79f2e55e6aba4cda25e2411c379679db2e9df7dee3c816e7534ddd7a21`
                        }
                    }
                );
            }

            res.status(200).json({ ok: true, message: 'User registered successfully' });
        } catch (error) {
            res.status(500).json({ error });
        }
    } else {
        res.status(400).json({ error: 'Bad Request' });
    }
};

module.exports.addItem = async (req, res) => {
    const rowDetails = req.body;

    if (rowDetails) {
        try {
            const response = await supabase.from('my_eo_website_format').insert(rowDetails);

            res.status(200).json({ result: response });
        } catch (error) {
            res.status(500).json({ error });
        }
    } else {
        res.status(400).json({ error: 'Bad Request' });
    }
};

module.exports.decreaseTest = async (req, res) => {
    res.status(200).json({
        result: await supabase.rpc('decrement_seats', {
            event_name: ['Test']
        })
    });
};

// module.exports.stats = async (req, res) => {
//     const { data } = await supabase.from('purchases').select('name,count,registration_fee');
//     const filtered_arr = [];
//     EVENTS.forEach((maj_item) => {
//         filtered_arr.push(
//             data.reduce(
//                 (acc, item) => {
//                     if (item.name === maj_item) {
//                         const acc_copy = { ...acc };
//                         acc_copy.name = item.name;
//                         acc_copy.count += +item.count;
//                         acc_copy.registration_fee = item.registration_fee;

//                         return acc_copy;
//                     }
//                 },
//                 { name: null, count: null, registration_fee: null }
//             )
//         );
//     });

//     // console.log(filtered_arr);
//     // res.status(200).json({ result });
// };
