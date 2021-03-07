import * as http from 'http'
import { URL } from 'url'
import { read } from './reader.js'

const port = process.env.PORT || 3142
const prefix = process.env.DIR || '.'

const server = http.createServer()

server.on('request', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.end(`{"error": "${http.STATUS_CODES[405]}"}`)
  } else {
    let rURL = new URL(req.url, 'localhost://')
    let fileName = prefix + rURL.pathname,
        numLines = Number(rURL.searchParams.get('lines')) || 1
    let logLines = await read(fileName, numLines),
        result = logLines ? logLines.toString().split('\n') : []
    res.end(JSON.stringify({
      file: fileName,
      result: result
    }))
  }
})

server.listen(port, () => {
  console.log(`TailD serving "${prefix}" on port ${port}`)
})
