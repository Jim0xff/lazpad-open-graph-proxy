import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import axios from 'axios';
import {ethers} from 'ethers';
import bodyParser from "body-parser";
import {PinataSDK} from 'pinata';


const {
    BLOG_BASE_URL = 'https://lazpad-web-git-test-ainur.vercel.app/pad',
    PORT = 4000,
    SOURCE_URL = 'https://lazpad-test.lazai.network',
    PINATA_JWT = '',
    GATEWAY_URL = ''
} = process.env;

const SOURCE_CACHE = new Map<string, any>();

const app = express();

app.use(bodyParser.json());

app.post('/verifySign', async(req, res)=>{
    //const message = "Sign this message to authenticate your wallet address \nNonce: a6154976-698d-4b5e-98b4-79ab9e9da96d\nAddress: 0xd4F8bbF9c0B8AFF6D76d2C5Fa4971a36fC9e4003";
    // const message = req.query.message as string;
    //const sign = "0xc6083dbd8756c66991a219becfbcd96d32371f5ec252037454935c745f3e6d627c8534338b3de5743409b1c11efeb5fe180a90681daf47a8aa46858eeaefa5291b";
    // const sign = req.query.sign as string;
    //const expectedAddress = "0xd4F8bbF9c0B8AFF6D76d2C5Fa4971a36fC9e4003";
    // const expectedAddress = req.query.expectedAddress as string;
    const { message, sign, expectedAddress } = req.body;

    const recoveredAddress = ethers.verifyMessage(message, sign);
    const isValid = recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
    return res.send({ success: isValid });
});

app.post('/uploadPinata', async(req, res)=>{
    const { fileData, question, typeStr } = req.body;
    const pinata = new PinataSDK({
        pinataJwt: PINATA_JWT,
        pinataGateway: GATEWAY_URL
      });
    const file = new File([fileData],question,{type: typeStr});
    const upload = await pinata.upload.public.file(file);
    return res.send(upload);
});

app.get('/', async (req, res) => {
    return res.redirect(BLOG_BASE_URL);
});

app.get('/robots.txt', async (req, res) => {
    return res.send('User-agent: *\nAllow: /');
});

app.get('/:target', async (req, res) => {
    const target = req.params.target as string;
    const inviteCode = req.query.inviteCode;
    console.log('target=', target);
    if (!target) {
        return res.status(400).send('Target is required');
    }

    const userAgent = req.headers['user-agent'] as string;
    console.log('userAgent=', userAgent);

    // Check if the request is from a browser
    const isBrowser = userAgent && (
        userAgent.includes('Mozilla') || // Firefox, Chrome, Safari, etc.
        userAgent.includes('Safari') ||  // Safari
        userAgent.includes('Chrome') ||  // Chrome
        userAgent.includes('Edge') ||    // Microsoft Edge
        userAgent.includes('Opera')      // Opera
    );

    if (isBrowser) {
        return res.redirect(BLOG_BASE_URL + '/' + target);
    }

    let pad = SOURCE_CACHE.get(target);
    if (!pad) {
        // /issue/detail?id=0x0cb7c5e34032658b730bf86ae78e9edc272d5fde
        const data = await axios.get(SOURCE_URL + "/issue/detail?id=" + target).then((res) => res.data);
        SOURCE_CACHE.set(target, data);
    }

    pad = SOURCE_CACHE.get(target);
    console.log('pad=', pad);
    const padData = pad.data;
    if (!padData) {
        return res.redirect(BLOG_BASE_URL + '/' + target);
    }

    return res.send(render(padData, inviteCode));
});

function render(pad: any, inviteCode: any) {
    let url = `${BLOG_BASE_URL}/${pad.address}`;
    if( inviteCode != null && inviteCode != `` ){
        url = url + '?inviteCode=' + inviteCode;
    }
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>${pad.title}</title>
        <meta name="twitter:title" content="${pad.title}" />
        <meta name="twitter:description" content="${pad.desc}" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@LazAINetwork" />
        <meta name="twitter:image" content="${pad.bannerImg}" />
        <meta property="og:title" content="${pad.title}" />
        <meta property="og:description" content="${pad.desc}" />
        <meta property="og:image" content="${pad.bannerImg}" />
        <meta property="og:url" content="${url}" />
    </head>
    <body>
        <h1>${pad.title}</h1>
        <p>${pad.desc}</p>
        <img src="${pad.bannerImg}" alt="${pad.title}">
        <a href="${url}">Read More</a>
    </body>
    </html>
    `;
}

app.listen(PORT, () => {
    console.log(`🚀  Server ready at: http://localhost:${PORT}`);
});
