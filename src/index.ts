import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import axios from 'axios';


const {
    BLOG_BASE_URL = 'https://lazpad-web-git-test-ainur.vercel.app/pad',
    PORT = 4000,
    SOURCE_URL = 'https://lazpad-test.lazai.network'
} = process.env;

const SOURCE_CACHE = new Map<string, any>();

const app = express();

app.get('/', async (req, res) => {
    return res.redirect(BLOG_BASE_URL);
});

app.get('/robots.txt', async (req, res) => {
    return res.send('User-agent: *\nAllow: /');
});

app.get('/:target', async (req, res) => {
    const target = req.params.target as string;
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
    if (!pad) {
        return res.redirect(BLOG_BASE_URL + '/' + target);
    }

    return res.send(render(pad));
});

function render(pad: any) {
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
        <meta property="og:url" content="${BLOG_BASE_URL}/${pad.address}" />
    </head>
    <body>
        <h1>${pad.title}</h1>
        <p>${pad.desc}</p>
        <img src="${pad.bannerImg}" alt="${pad.title}">
        <a href="${BLOG_BASE_URL}/${pad.address}">Read More</a>
    </body>
    </html>
    `;
}

app.listen(PORT, () => {
    console.log(`🚀  Server ready at: http://localhost:${PORT}`);
});
