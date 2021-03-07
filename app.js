import * as http from 'http'
import { URL } from 'url'
import { createReadStream } from 'fs'
import { initMetadataCache } from './cache.js'

const port = process.env.PORT || 3142,
      prefix = process.env.DIR || './logs',
      inputLength = 256

const metadataCache = await initMetadataCache(prefix)

const server = http.createServer()

server.on('request', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.end(`{"error": "${http.STATUS_CODES[405]} - ${req.method}"}`)
  } else {
    let rURL = new URL(req.url, 'localhost://')
    let filePath = prefix + rURL.pathname,
        numLines = Number(rURL.searchParams.get('lines')) || 1,
        pattern = rURL.searchParams.get('pattern')
    if (filePath && filePath.length > inputLength
        || pattern && pattern.length > inputLength) {
      res.statusCode = 400;
      res.end(`{"error": "Path and pattern are each limited to ${inputLength} characters"}`)
    }
    let nLinesStartIndex = metadataCache[filePath].lines.length - numLines - 1,
        nLinesStartBytes = metadataCache[filePath].lines[nLinesStartIndex]
    createReadStream(filePath, { start: nLinesStartBytes }).pipe(res)
  }
})

server.listen(port, () => {
  console.log(`TailD serving "${prefix}" on port ${port}`)
})
