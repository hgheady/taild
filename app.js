import * as http from 'http'
import { URL } from 'url'
import { initMetadata } from './metadata.js'
import { getReader, getSufficientStream } from './reader.js'
import { lineT, filterT, responseT, streamSeq, reverseSeq } from './transform.js'
import { port, prefix, cacheLength, inputLength } from './config.js'


const metadata = cacheLength ? await initMetadata(prefix) : {}

const server = http.createServer()

server.on('request', async (req, res) => {
  const respond = response(res)
  if (req.method !== 'GET') {
    return respond(405, {error: `${http.STATUS_CODES[405]} - ${req.method}`})
  }
  let r = new URL(req.url, `http://${req.headers.host}`)
  let filePath = prefix + r.pathname,
      numLines = Number(r.searchParams.get('lines')) || 1,
      pattern = r.searchParams.get('pattern')
  if (filePath && filePath.length > inputLength
      || pattern && pattern.length > inputLength) {
    return respond(400, {error: `Path and pattern are each limited to ${inputLength} characters`})
  }
  try {
    let source, cacheIndex
    const cached = metadata[filePath] && metadata[filePath].lines
    if (!cached) {
      source = await getSufficientStream(filePath, numLines)
    } else if (cached.length > numLines) {
      cacheIndex = cached.length - numLines - 1
      source = await getReader(filePath, cached[cacheIndex])
    } else {
      let tail = await getReader(filePath, cached[0]),
          rest = await getSufficientStream(filePath, numLines - (cached.length-1), cached[0])
      source = streamSeq(rest, tail)
    }
    if (!source) {
      return respond(404, {error: `File not found: ${filePath}`})
    }
    const out = await reverseSeq(source.pipe(lineT())
                                 .pipe(filterT(pattern))
                                 .pipe(responseT()))
    if (out) return respond(200, out, [['Content-Type', 'text/plain'],
                                       ['X-Log-File', filePath],
                                       ['X-Requested-Lines', numLines]])
    else throw `Response failed: lines=${numLines} path=${filePath}`
  } catch (e) {
    console.log(e)
    return respond(500, {error: "Unexpected error"})
  }
})

server.listen(port, () => {
  console.log(`TailD serving "${prefix}" on port ${port}`)
})

function response(res) {
  return (s,b,h=null) => respond(res, s, b, h)
}

function respond(res, status, body, headers) {
  res.statusCode = status
  if (headers) headers.forEach(([k,v]) => res.setHeader(k,v))
  else res.setHeader('Content-Type', 'application/json')
  if (body instanceof Buffer) res.end(body)
  else res.end(JSON.stringify(body))
}
