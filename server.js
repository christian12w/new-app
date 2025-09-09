const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8002;

// MIME types
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Simple SSI processing
function processSSI(content, filePath) {
  const includeRegex = /<!--#include file="([^"]+)"\s*-->/g;
  return content.replace(includeRegex, (match, includePath) => {
    try {
      const fullPath = path.join(path.dirname(filePath), includePath);
      return fs.readFileSync(fullPath, 'utf8');
    } catch (err) {
      console.error(`Error including file ${includePath}:`, err.message);
      return match; // Return original if error
    }
  });
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;
  
  // Handle root path
  if (pathname === '/') {
    pathname = '/index.html';
  }
  
  const filePath = path.join(process.cwd(), pathname);
  
  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    
    // Get file extension
    const extname = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';
    
    // Read file
    fs.readFile(filePath, 'utf8', (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
        return;
      }
      
      // Process SSI for HTML files
      if (extname === '.html') {
        content = processSSI(content, filePath);
      }
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Current directory: ${process.cwd()}`);
});