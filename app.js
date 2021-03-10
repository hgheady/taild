import * as http from 'http'
import { URL } from 'url'
import { createReadStream } from 'fs'
import { initMetadata } from './metadata.js'
import { lineT, filterT, responseT, reverseSeq } from './transform.js'

const port = process.env.PORT || 3142,
      prefix = process.env.DIR || './logs',
      inputLength = 256

const metadata = await initMetadata(prefix)

const server = http.createServer()

server.on('request', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'GET') {
    res.statusCode = 405;
    return res.end(`{"error": "${http.STATUS_CODES[405]} - ${req.method}"}`)
  } else {
    let r = new URL(req.url, `http://${req.headers.host}`)
    let filePath = prefix + r.pathname,
        numLines = Number(r.searchParams.get('lines')) || 1,
        pattern = r.searchParams.get('pattern')
    if (filePath && filePath.length > inputLength
        || pattern && pattern.length > inputLength) {
      res.statusCode = 400;
      return res.end(`{"error": "Path and pattern are each limited to ${inputLength} characters"}`)
    }
    if (!metadata[filePath]) {
      res.statusCode = 404;
      return res.end(`{"error": "Path unknown"}`)
    }
    let nLinesStartIndex = metadata[filePath].lines.length - numLines - 1,
        nLinesStartBytes = metadata[filePath].lines[nLinesStartIndex]
    try {
      res.setHeader('Content-Type', 'text/plain')
      res.setHeader('X-Log-File', filePath)
      res.setHeader('X-Requested-Lines', numLines)

      const out = await reverseSeq(
        createReadStream(filePath, { start: nLinesStartBytes })
          .pipe(lineT())
          .pipe(filterT(pattern))
          .pipe(responseT()))
      if (out) res.end(out)
      else throw `reverseSeq failed: lines=${numLines} path=${filePath}`
    } catch (e) {
      console.log(e)
      res.setHeader('Content-Type', 'application/json')
      res.statusCode = 500;
      return res.end(`{"error": "Unexpected error"}`)
    }
  }
})

server.listen(port, () => {
  console.log(`TailD serving "${prefix}" on port ${port}`)
})
