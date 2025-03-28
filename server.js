const path = require('path');
const fs = require('fs');
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Print environment for debugging
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', port);
console.log('Current directory:', process.cwd());

// Check if .next directory exists
const nextDir = path.join(process.cwd(), '.next');
console.log('.next directory exists:', fs.existsSync(nextDir));

// Create the Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  console.log('Next.js app prepared and ready');
  
  // List static asset directories
  const staticDirs = [
    path.join(process.cwd(), '.next/static'),
    path.join(process.cwd(), 'public')
  ];
  
  staticDirs.forEach(dir => {
    console.log(`Checking static directory: ${dir}`);
    console.log(`Directory exists: ${fs.existsSync(dir)}`);
    if (fs.existsSync(dir)) {
      try {
        console.log(`Directory contents: ${fs.readdirSync(dir).join(', ')}`);
      } catch (err) {
        console.error(`Error reading directory: ${err.message}`);
      }
    }
  });

  createServer(async (req, res) => {
    try {
      // Parse the URL
      const parsedUrl = parse(req.url, true);
      const { pathname } = parsedUrl;
      
      console.log(`Request received: ${pathname}`);
      
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
      console.log(`Handling regular request: ${pathname}`);
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