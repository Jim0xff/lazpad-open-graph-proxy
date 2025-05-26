import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import axios from 'axios';
const { BLOG_BASE_URL = 'https://lazai.network/blogs', SOURCE_URL = 'https://raw.githubusercontent.com/0xLazAI/lazai-web-blogs/main/list.json', PORT = 4000, } = process.env;
const SOURCE_CACHE = new Map();
const app = express();
app.get('/', async (req, res) => {
    return res.redirect(BLOG_BASE_URL);
});
app.get('/robots.txt', async (req, res) => {
    return res.send('User-agent: *\nAllow: /');
});
app.get('/:target', async (req, res) => {
    const target = req.params.target;
    console.log('target=', target);
    if (!target) {
        return res.status(400).send('Target is required');
    }
    const userAgent = req.headers['user-agent'];
    console.log('userAgent=', userAgent);
    // Check if the request is from a browser
    const isBrowser = userAgent && (userAgent.includes('Mozilla') || // Firefox, Chrome, Safari, etc.
        userAgent.includes('Safari') || // Safari
        userAgent.includes('Chrome') || // Chrome
        userAgent.includes('Edge') || // Microsoft Edge
        userAgent.includes('Opera') // Opera
    );
    if (isBrowser) {
        return res.redirect(BLOG_BASE_URL + '/' + target);
    }
    let blog = SOURCE_CACHE.get(target);
    if (!blog) {
        const data = await axios.get(SOURCE_URL).then((res) => res.data);
        for (const i of data.list) {
            SOURCE_CACHE.set(i.link, i);
        }
    }
    blog = SOURCE_CACHE.get(target);
    console.log('blog=', blog);
    if (!blog) {
        return res.redirect(BLOG_BASE_URL + '/' + target);
    }
    return res.send(render(blog));
});
function render(blog) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>${blog.title}</title>
        <meta name="twitter:title" content="${blog.title}" />
        <meta name="twitter:description" content="${blog.desc}" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@LazAINetwork" />
        <meta name="twitter:image" content="${blog.banner}" />
        <meta property="og:title" content="${blog.title}" />
        <meta property="og:description" content="${blog.desc}" />
        <meta property="og:image" content="${blog.banner}" />
        <meta property="og:url" content="${BLOG_BASE_URL}/${blog.link}" />
    </head>
    <body>
        <h1>${blog.title}</h1>
        <p>${blog.desc}</p>
        <img src="${blog.banner}" alt="${blog.title}">
        <a href="${BLOG_BASE_URL}/${blog.link}">Read More</a>
    </body>
    </html>
    `;
}
app.listen(PORT, () => {
    console.log(`🚀  Server ready at: http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map