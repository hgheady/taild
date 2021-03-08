import * as http from 'http'
import { URL } from 'url'
import { createReadStream } from 'fs'
import { initMetadata } from './metadata.js'
import { lineT, filterT, responseT } from './transform.js'

const port = process.env.PORT || 3142,
      prefix = process.env.DIR || './logs',
      inputLength = 256

const metadata = await initMetadata(prefix)

const server = http.createServer()

server.on('request', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.end(`{"error": "${http.STATUS_CODES[405]} - ${req.method}"}`)
  } else {
    let r = new URL(req.url, `http://${req.headers.host}`)
    let filePath = prefix + r.pathname,
        numLines = Number(r.searchParams.get('lines')) || 1,
        pattern = r.searchParams.get('pattern')
    if (filePath && filePath.length > inputLength
        || pattern && pattern.length > inputLength) {
      res.statusCode = 400;
      res.end(`{"error": "Path and pattern are each limited to ${inputLength} characters"}`)
    }
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('X-Log-File', filePath);
    res.setHeader('X-Requested-Lines', numLines);
    let nLinesStartIndex = metadata[filePath].lines.length - numLines - 1,
        nLinesStartBytes = metadata[filePath].lines[nLinesStartIndex]
    createReadStream(filePath, { start: nLinesStartBytes })
      .pipe(lineT())
      .pipe(filterT(pattern))
      .pipe(responseT())
      .pipe(res)
  }
})

server.listen(port, () => {
  console.log(`TailD serving "${prefix}" on port ${port}`)
})
