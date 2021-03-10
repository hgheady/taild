import { Transform } from 'stream'
export { lineT, filterT, responseT, reverseSeq }


function lineT() {
  return new Transform({
    encoding: 'utf8',
    transform: function(chunk, encoding, callback) {
      const str = chunk.toString(),
            list = str.split('\n')
      list.forEach( e => {
        this.push(e)
      })
      callback()
    }
  })
}

function filterT(pattern = null) {
  return new Transform({
    encoding: 'utf8',
    transform: function(chunk, encoding, callback) {
      if(!pattern || chunk.toString().indexOf(pattern) !== -1) {
        this.push(chunk)
      }
      callback()
    }
  })
}

function responseT() {
  return new Transform({
    transform: function(chunk, encoding, callback) {
      this.push(chunk)
      this.push(Buffer.from('\n'))
      callback()
    }
  })
}

async function reverseSeq(readable) {
  return new Promise((resolve, reject) => {
    const bufs = []
    readable.on('data', (bs) => {
      bufs.unshift(bs)
    })
    readable.on('end', function() {
      resolve(Buffer.concat(bufs))
    })
    readable.on('error', (e) => {
      console.log(e)
      resolve(null)
    })
  })
}
