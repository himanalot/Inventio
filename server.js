const path = require('path');
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Create the Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      // Parse the URL
      const parsedUrl = parse(req.url, true);
      const { pathname } = parsedUrl;
      
      // Special handling for static files to ensure CSS and other assets load correctly
      if (
        pathname.startsWith('/_next/') ||
        pathname.startsWith('/static/') ||
        /\.(css|js|svg|png|jpg|jpeg|gif|ico|json)$/.test(pathname)
      ) {
        console.log(`Serving static asset: ${pathname}`);
        // Let Next.js handle static files
        await handle(req, res, parsedUrl);
        return;
      }

      // Let Next.js handle all other requests
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
}); 