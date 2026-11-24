const http = require('node:http');
const { Readable } = require('node:stream');
const { pipeline } = require('node:stream/promises');

import('./proxy.mjs').then(({ proxy }) => {
  http.createServer(async (req, res) => {
    if (!req.url.startsWith('/')) {
      res.writeHead(400).end();
      return;
    }
    const body = ['GET', 'HEAD'].includes(req.method) ? undefined : req;
    const response = await proxy(req.url, req.method, new Headers(req.headers), body);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    if (!response.body) return res.end();
    try {
      await pipeline(Readable.fromWeb(response.body), res);
    } catch {
      res.destroy();
    }
  }).listen(process.env.PORT || 3000);
});
