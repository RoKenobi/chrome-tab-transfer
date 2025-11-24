const http = require('http');

// Store tab data in memory (resets when server restarts)
let tabData = null;

const server = http.createServer((req, res) => {
  // Enable CORS so Chrome extension can talk to us
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Route: POST /export - Save tab data
  if (req.method === 'POST' && req.url === '/export') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        tabData = JSON.parse(body);
        console.log('✅ Received tab data:', {
          windows: tabData.windows.length,
          totalTabs: tabData.windows.reduce((sum, w) => sum + w.tabs.length, 0)
        });
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Tabs exported' }));
      } catch (error) {
        console.error('❌ Export error:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
    return;
  }

  // Route: GET /import - Retrieve tab data
  if (req.method === 'GET' && req.url === '/import') {
    if (!tabData) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'No tab data available' }));
      return;
    }
    
    console.log('📤 Sending tab data to another profile');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data: tabData }));
    return;
  }

  // Route: GET /status - Check if server is running
  if (req.method === 'GET' && req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'running',
      hasData: tabData !== null,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // 404 for unknown routes
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

const PORT = 7878;
server.listen(PORT, 'localhost', () => {
  console.log('🚀 Chrome Tab Transfer Server running!');
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log('💡 Keep this running while transferring tabs');
  console.log('\nEndpoints:');
  console.log('  POST /export  - Save tabs');
  console.log('  GET  /import  - Retrieve tabs');
  console.log('  GET  /status  - Check server\n');
});