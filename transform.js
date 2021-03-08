import { Transform } from 'stream'
export { lineT, filterT, responseT }


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
