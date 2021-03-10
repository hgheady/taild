import { createReadStream } from 'fs'
import { stat } from 'fs/promises'

export { getReader, getSufficientStream, blkBoundaryIter }


async function getStat(fileName) {
  try {
    const s = await stat(fileName)
    return s
  } catch (e) {
    console.log(e)
    return null
  }
}

async function getReader(fileName, start, end, stat=null) {
  stat = stat || await getStat(fileName)
  if (stat) return createReadStream(fileName, { start: start, end: end })
  else return null
}

async function getSufficientStream(fileName, minLines, end) {
  let stats, blkSize
  try {
    stats = await stat(fileName)
    blkSize = stats.blksize
    end = end || stats.size
  } catch (e) {
    console.log(e)
    return null
  }
  let rs, bsRead = 0, nsRead = 0, newlines = 0, offset = 0
  for (const bound of blkBoundaryIter(blkSize, end)) {
    rs = await getReader(fileName, bound, end-offset, stats)
    try {
      [bsRead, nsRead] = await nLinesOffset(rs, minLines-newlines)
      offset += bsRead
      newlines += nsRead
    } catch (err) {
      console.log(err)
    }
    if (newlines > minLines) {
      rs = await getReader(fileName, end-offset, end, stats)
      return rs
    }
  }
  return rs
}

function* blkBoundaryIter(blkSize, max) {
  if (!blkSize || blkSize <= 0) return 0
  let offset = max % blkSize
  for (let bound = max-offset; bound >= 0; bound -= blkSize) {
    if (bound == max) bound = 0
    yield bound
  }
}

async function nLinesOffset(readable, n) {
  return new Promise((resolve, reject) => {
    let bs = []
    readable.on('data', b => bs.push(b))
    readable.on('end', function() {
      let offset = 0, newlines = 0
      for (let i = bs.length-1; i != 0; --i) {
        for (let j = bs[i].length-1; j != 0; --j) {
          if (bs[i][j] == 10) ++newlines
          ++offset
          if (newlines > n) resolve([offset, newlines])
        }
      }
      resolve([offset, newlines])
    })
  })
}
