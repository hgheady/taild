import * as http from 'http'
import { URL } from 'url'
import { initMetadata } from './metadata.js'
import { getReader, getSufficientStream } from './reader.js'
import { lineT, filterT, responseT, auxiliaryStream, reverseSeq } from './transform.js'
import { port, prefix, cacheLength, inputLength } from './config.js'


const metadata = cacheLength ? await initMetadata(prefix) : {}

const server = http.createServer()

server.on('request', async (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  if (req.method !== 'GET') {
    res.statusCode = 405
    return res.end(`{"error": "${http.STATUS_CODES[405]} - ${req.method}"}`)
  }
  let r = new URL(req.url, `http://${req.headers.host}`)
  let filePath = prefix + r.pathname,
      numLines = Number(r.searchParams.get('lines')) || 1,
      pattern = r.searchParams.get('pattern')
  if (filePath && filePath.length > inputLength
      || pattern && pattern.length > inputLength) {
    res.statusCode = 400
    return res.end(`{"error": "Path and pattern are each limited to ${inputLength} characters"}`)
  }

  try {
    res.setHeader('Content-Type', 'text/plain')
    res.setHeader('X-Log-File', filePath)
    res.setHeader('X-Requested-Lines', numLines)

    let source, cacheIndex, cachedOffset
    const cached = metadata[filePath] && metadata[filePath].lines
    if (!cached) {
      source = await getSufficientStream(filePath, numLines)
    } else if (cached.length > numLines) {
      cacheIndex = cached.length - numLines - 1
      source = await getReader(filePath, cached[cacheIndex])
    } else {
      let aux = await getSufficientStream(
        filePath, numLines - (cached.length-1), cached[0]-1),
          prm = await getReader(filePath, cached[0])
      source = auxiliaryStream(aux, prm)
    }
    if (!source) {
      res.setHeader('Content-Type', 'application/json')
      res.statusCode = 404
      return res.end(`{"error": "File not found: ${filePath}"}`)
    }
    const out = await reverseSeq(source.pipe(lineT())
                                 .pipe(filterT(pattern))
                                 .pipe(responseT()))
    if (out) res.end(out)
    else throw `reverseSeq failed: lines=${numLines} path=${filePath}`
  } catch (e) {
    console.log(e)
    res.setHeader('Content-Type', 'application/json')
    res.statusCode = 500
    return res.end(`{"error": "Unexpected error"}`)
  }
})

server.listen(port, () => {
  console.log(`TailD serving "${prefix}" on port ${port}`)
})
