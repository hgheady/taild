import * as http from 'http'
import { URL } from 'url'
import { read } from './reader.js'

const port = process.env.PORT || 3142,
      prefix = process.env.DIR || '.',
      inputLength = 256

const server = http.createServer()

server.on('request', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.end(`{"error": "${http.STATUS_CODES[405]}"}`)
  } else {
    let rURL = new URL(req.url, 'localhost://')
    let fileName = prefix + rURL.pathname,
        numLines = Number(rURL.searchParams.get('lines')) || 1,
        pattern = rURL.searchParams.get('pattern')
    if (fileName && fileName.length > inputLength
        || pattern && pattern.length > inputLength) {
      res.statusCode = 400;
      res.end(`{"error": "Path and pattern are each limited to 256 characters"}`)
    }
    let logLines = await read(fileName, numLines),
        result = logLines ? logLines.toString().split('\n') : [],
        // Filter syntax is open-ended in power/complexity/vulnerability;
        // this will do for now
        output = pattern ? result.filter(s => s.indexOf(pattern) >= 0) : result
    res.end(JSON.stringify({
      file: fileName,
      result: output
    }))
  }
})

server.listen(port, () => {
  console.log(`TailD serving "${prefix}" on port ${port}`)
})
