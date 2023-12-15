const { supabase } = require('../db/dbConfig');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { generateNewPool } = require('../db/dbConfig');
const axios = require('axios');
const _ = require('lodash');
const { EVENTS, returnUrl, transporter } = require('./../helper');
const crypto = require('crypto');
const querystring = require('querystring');
const fs = require('fs');
const path = require('path');
const engine = require('express-engine-jsx');
const { createClient } = require('redis');
const client = createClient({ url: process.env.NODE_ENV === 'production' ? process.env.REDIS_URL : process.env.EXT_REDIS_URL });

client.on('error', (err) => console.log('Redis Client Error', err));
client.connect().then(() => console.log('Redis Connected'));

function getAlgorithm(keyBase64) {
    var key = Buffer.from(keyBase64, 'base64');
    switch (key.length) {
        case 16:
            return 'aes-128-cbc';
        case 32:
            return 'aes-256-cbc';
    }
    throw new Error('Invalid key length: ' + key.length);
}

function encrypt(plainText, keyBase64, ivBase64) {
    const key = Buffer.from(keyBase64, 'base64');
    const iv = Buffer.from(ivBase64, 'base64');

    const cipher = crypto.createCipheriv(getAlgorithm(keyBase64), key, iv);
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

const generatePaymentIntent = async (amount, currency, descriptor, usDetails) => {
    if (usDetails) {
        return await stripe.paymentIntents.create({
            amount: +amount,
            currency: currency,
            payment_method_types: ['card'],
            automatic_payment_methods: {
                enabled: false
            },
            shipping: {
                name: usDetails.name,
                address: {
                    line1: usDetails.address,
                    postal_code: usDetails.postalcode,
                    city: usDetails.city,
                    state: usDetails.state,
                    country: usDetails.country
                }
            },
            description: descriptor
        });
    } else {
        return await stripe.paymentIntents.create({
            amount: +amount,
            currency: currency,
            payment_method_types: ['card'],
            automatic_payment_methods: {
                enabled: false
            },
            description: descriptor
        });
    }
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
        const paymentIntent = await generatePaymentIntent(req.body.amount, req.body.currency, req.body.descriptor, req.body?.usDetails);
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
    const requestBody = structuredClone?.(req.body) || JSON.parse(JSON.stingify(req.body) || '{}');
    if (requestBody?.ticketDetails) {
        const { ticketDetails, frontend_url, cartId } = requestBody;
        try {
            const response = await supabase.from('purchases').insert(ticketDetails);
            // const decrement = await supabase.rpc('decrement_seats', {
            //     event_name: ticketDetails.map((item) => item.name)
            // });

            const decrement = [];
            const ticketNames = ticketDetails
                .map((item) => {
                    const arr = [];
                    for (let i = 1; i <= item.count; i++) {
                        arr.push(item.name);
                    }
                    return arr;
                })
                .flat();
            for (const i of ticketNames) {
                const status_Decr = await supabase.rpc('decrement_seats', {
                    event_name: [i]
                });
                decrement.push(status_Decr.status);
            }
            // airtable;
            if (response?.status === 201 && decrement?.every((item) => item === 204)) {
                console.log('done supabase');
                const airtableResponse = await axios.post(
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
                if ('records' in airtableResponse.data) {
                    console.log('done airtable');

                    const message = await transporter.sendMail({
                        from: 'info@riekol.com', // sender address
                        to: `${ticketDetails[0].email}`, // list of receivers
                        subject: 'Invoice from RIEKOL', // Subject line
                        html: engine(path.resolve(__dirname + '/../views/example.jsx'), { ticketDetails }).toString()
                    });
                    if (message) {
                        console.log('done mail');
                        try {
                            const redis_deleted_entry = await client.del([cartId]);
                            console.log('redis entry deleted', redis_deleted_entry);
                        } catch (error) {
                            console.log('in error of mail catch');
                            console.log(error);
                        }
                        // const fronend_url = `${returnUrl()}/thankyou`;
                        console.log('fronend url ===> ', frontend_url);
                        res.redirect(302, frontend_url);
                        // res.status(200).json({ ok: true, message: 'User registered successfully', context: message });
                    } else {
                        res.status(500).json({ ok: false, message: 'Something went wrong', context: message });
                    }
                }
            }
        } catch (error) {
            res.status(500).json({ error: error.stack });
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

module.exports.stats = async (req, res) => {
    const { data } = await supabase.from('purchases').select('name,count,registration_fee');

    res.status(200).json({ result: data });
};

module.exports.ccavenueInitiate = async (req, res) => {
    const workingKey = process.env.CCAVENUE_SECRET; //Put in the 32-Bit key shared by CCAvenues.
    const accessCode = process.env.CCAVENUE_ACCESS_CODE; //Put in the Access Code shared by CCAvenues.

    //Generate Md5 hash for the key and then convert in base64 string
    var md5 = crypto.createHash('md5').update(workingKey).digest();
    var keyBase64 = Buffer.from(md5).toString('base64');

    //Initializing Vector and then convert in base64 string
    var ivBase64 = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f]).toString('base64');

    const url = process.env.NODE_ENV === 'production' ? 'https://riekol-server.onrender.com' : 'http://localhost:1337';
    const order_id = crypto.randomUUID();
    const encReq = encrypt(
        querystring.stringify({
            merchant_id: process.env.CCAVENUE_MERCHANTID,
            order_id,
            currency: req.query.currency,
            amount: +req.query.amount,
            redirect_url: `${url}/users/payment_status`,
            cancel_url: `${url}/users/payment_status`,
            integration_type: 'iframe_normal',
            language: 'EN',
            billing_name: req.query.name,
            billing_email: req.query.email,
            merchant_param1: req.query.chapter,
            merchant_param2: req.query?.cartId ?? null,
            billing_tel: req.query.phone
        }),
        keyBase64,
        ivBase64
    );
    res.status(200).json({ result: { encReq, accessCode } });
};

module.exports.saveDataInRedis = async (req, res) => {
    const cartId = `cart_${crypto.randomUUID()}`;
    await client.set(cartId, JSON.stringify(req.body));

    res.status(200).json({ result: cartId });
};

module.exports.paymentStatus = async (req, res) => {
    const encResp = req.body.encResp;

    const workingKey = process.env.CCAVENUE_SECRET; //Put in the 32-Bit key shared by CCAvenues.
    const accessCode = process.env.CCAVENUE_ACCESS_CODE; //Put in the Access Code shared by CCAvenues.

    const md5 = crypto.createHash('md5').update(workingKey).digest();
    const keyBase64 = Buffer.from(md5).toString('base64');
    var ivBase64 = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f]).toString('base64');
    function decrypt(messagebase64, keyBase64, ivBase64) {
        const key = Buffer.from(keyBase64, 'base64');
        const iv = Buffer.from(ivBase64, 'base64');

        const decipher = crypto.createDecipheriv(getAlgorithm(keyBase64), key, iv);
        let decrypted = decipher.update(messagebase64, 'hex');
        decrypted += decipher.final();
        return decrypted;
    }

    const decryptedData = decrypt(encResp, keyBase64, ivBase64);
    const parsedData = querystring.parse(decryptedData);

    if (parsedData.order_status === 'Success') {
        let cart = await client.get(parsedData.merchant_param2);

        const frontend_url = `${returnUrl()}/thankyou?status=${parsedData.order_status}`;
        const _req = { ...req, body: { ...JSON.parse(cart), frontend_url, cartId: parsedData.merchant_param2 } };

        await this.registerUser(_req, res);
    } else {
        const fronend_url = `${returnUrl()}/thankyou?status=${parsedData.order_status}&email=${parsedData.billing_email}&name=${parsedData.billing_name}`;

        res.redirect(302, fronend_url);
    }
};

module.exports.saveTemporaryUsers = async (req, res) => {
    const {
        modalVal: { name, contact, chapter, email },
        billingAmount: amount,
        id,
        currency
    } = req.body;

    try {
        if (!name || !contact || !chapter || !email || !id || !currency) {
            res.status(400).json({ result: 'Bad Request' });
        }
        const result = await supabase.from('payment_link').insert({
            id,
            name,
            contact,
            chapter,
            email,
            amount,
            currency
        });

        res.status(200).json({ result });
    } catch (err) {
        res.status(500).json({ result: err });
    }
};

module.exports.getMailingList = async (req, res) => {
    try {
        const result = await supabase.from('payment_link').select('*');

        res.status(200).json({ result });
    } catch (error) {
        res.status(500).json({ error });
    }
};

module.exports.sendSequentialMail = async (req, res) => {
    const json = [
        {
            name: 'MyEO Ganga Aarti with Shikara ride',
            start_time: '2:00 PM',
            end_time: '6:30 PM',
            registration_fee: '3,000',
            order_id: '853944cb-6331-44b1-9818-c635992b0ee9',
            count: 2,
            email: 'mitul1719@gmail.com',
            price_id: 'ff5060a9-980d-4768-99f8-16febf836074',
            created: '08:01:07 GMT+0800 (Singapore Standard Time)',
            event_date: '11-Jan - 11-Jan',
            calc: 2,
            'Last Modified Time': '11/30/2023 12:01am',
            customer_name: 'Suraj Jaising'
        }
        //keep mails in this shape
    ];
    try {
        const funcArr = json.map((item) =>
            transporter.sendMail({
                from: 'info@riekol.com', // sender address
                to: `${item.email}`, // list of receivers
                subject: 'Invoice from RIEKOL', // Subject line
                html: engine(path.resolve(__dirname + '/../views/example.jsx'), { ticketDetails: [item] }).toString()
            })
        );

        // console.log(await Promise.all(funcArr));
        res.status(200).json({ result: true });
    } catch (error) {
        res.status(500).json({ result: false });
    }
};
