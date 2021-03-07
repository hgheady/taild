import { createReadStream } from 'fs'
import { stat } from 'fs/promises'

export { read }

/* TODO:
- use filehandle.read?
*/
async function getSufficientBuffer(fileName, n) {
  let stats, BLKSIZE, fileSize
  try {
    stats = await stat(fileName)
    BLKSIZE = stats.blksize
    fileSize = stats.size
  } catch (e) {
    console.log(e)
    return null
  }
  let rs = null,
      blocks = 1,
      offset = null,
      buf = null,
      all = false
  while (true) {
    offset = Math.max(0, fileSize - BLKSIZE*blocks)
    rs = createReadStream(fileName, { start: offset, end: fileSize })
    try {
       [buf, all] = await nLinesBuffer(rs, n)
    } catch (err) {
      console.log(err)
    }
    if (all || offset == 0) break
    else ++blocks
  }
  return buf
}

/* TODO:
- count newlines as they stream (slice large chunks)
- JSON list stringify the buffer in-place?
*/
async function nLinesBuffer(readable, lines) {
  return new Promise((resolve, reject) => {
    let bs = []
    readable.on('data', b => bs.push(b))
    readable.on('end', function() {
      let newlines = 0
      for (let i = bs.length-1; i != 0; --i) {
        for (let j = bs[i].length-1; j != 0; --j) {
          if (bs[i][j] == 10) ++newlines
        }
        if (newlines > lines) resolve([Buffer.concat(bs.slice(i)), true])
      }
      resolve([Buffer.concat(bs), false])
    })
  })
}

function nLines(buf, n) {
  let newlines = 0
  for (let i = buf.length-1; i >= 0; --i) {
    if (buf[i] == 10) {
      ++newlines
      if (newlines == n+1) return buf.slice(i)
    }
  }
  return buf
}

async function read(fileName, n) {
  const lines = await getSufficientBuffer(fileName, n)
  return lines ? nLines(lines, n) : null
}
