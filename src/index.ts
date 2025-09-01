import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import axios from 'axios';
import {ethers} from 'ethers';
import bodyParser from "body-parser";
import {PinataSDK} from 'pinata';
import cors from 'cors';


const {
    BLOG_BASE_URL = 'https://lazpad-web-git-test-ainur.vercel.app/pad',
    PORT = 4000,
    SOURCE_URL = 'https://lazpad-test.lazai.network',
    LAZBUBU_URL = "https://lazbubu-backend-b3z67.ondigitalocean.app",
    GATEWAY_URL = 'https://plum-occupational-silkworm-146.mypinata.cloud',
    PINATA_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIxZDc0MTdhMi1kMDIwLTQ4YmItYWVmOC05N2RlODdmZTZkNTAiLCJlbWFpbCI6ImV2YW4ueUBtZXRpcy5pbyIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiIwNjZmZDIzYmM3OThlY2RjZTZmOCIsInNjb3BlZEtleVNlY3JldCI6ImM5Nzc4NzA4OGUzYzUxZTZlY2QzNjY3YWQ4Mjk1OGExYTMwMjM0ZjUyNmEwNDdjOTllZjAzZTQzZDIzNjEzZTkiLCJleHAiOjE3ODEyNDc3ODF9.mTfGjYgZV_UMcOA6BQ7J47P2ojmzd4D3_fRK9vXGhC0'
    
} = process.env;

const SOURCE_CACHE = new Map<string, any>();

const app = express();

app.use(bodyParser.json());

app.use(cors({
    origin: ['http://localhost:3000',"https://generate-dat-web-git-dev-ainur.vercel.app","https://generate-dat-web.vercel.app","https://predat.lazai.network"], // 设置允许的源
    credentials: true, // 如果需要携带 cookie
  }));

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

app.post('/deletePinata', async(req, res)=>{
    const { files } = req.body;
    const pinata = new PinataSDK({
        pinataJwt: PINATA_JWT,
        pinataGateway: GATEWAY_URL
      });
    const unpin = await pinata.files.public.delete(files)
    return res.send(unpin);
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


app.get('/chatShare/:shareId', async (req, res) => {
    const shareId = req.params.shareId as string;
    // const inviteCode = req.query.inviteCode;
    if (!shareId) {
        return res.status(400).send('shareId is required');
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
    const response = await axios.get(LAZBUBU_URL + "/lazbubu/shareInfo/" + shareId).then((res) => res.data);
    return res.send(renderShareChat(response.data, shareId));
});

function renderShareChat(data: any, shareId: string) {
    return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
    />
    <meta
      http-equiv="refresh"
      content="0; url=https://lazbubu-git-test-ainur.vercel.app/share/${shareId}"
    />
    <title>Lazbubu</title>

    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="Lazbubu - AI Chat Highlights" />
    <meta
      property="og:description"
      content="View full conversations and experience intelligent AI interactions."
    />
    <meta property="og:image" content="${data.imageUrl}" />
    <meta
      property="og:url"
      content="https://lazbubu-git-test-ainur.vercel.app/lazbubu"
    />
    <meta property="og:site_name" content="Lazbubu" />

    <!-- Twitter Meta Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="${data.imageUrl}" />
    <meta name="twitter:site" content="@LazAINetwork" />
    <meta name="twitter:creator" content="@LazAINetwork" />

    <!-- Additional Meta Tags -->
    <meta
      name="description"
      content="View full conversations and experience intelligent AI interactions."
    />
    <meta
      name="keywords"
      content="AI, chat, intelligence, Lazbubu, LazAINetwork, artificial intelligence"
    />
    <meta name="author" content="LazAINetwork" />
  </head>
  <body></body>
</html>
    `;
}

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
