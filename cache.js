import { createReadStream } from 'fs'
import { readdir, stat, watch } from 'fs/promises'
export { initMetadataCache }

async function initMetadataCache(directory) {
  const fileMetadataMap = await initMetadata(directory)
  installWatcher(directory, fileMetadataMap)
  return fileMetadataMap
}

async function initMetadata(directory) {
  let all = await readdir(directory)
  const map = {}
  let st, size, path, rs, nis
  for (let name of all) {
    path = directory+'/'+name
    st = await stat(path)
    size = st.size
    rs = createReadStream(path)
    nis = await newlineIndices(rs)
    map[path] = {
      size: size,
      lines: nis
    }
  }
  return map
}

async function installWatcher(directory, fileMetadataMap) {
  try {
    const watcher = watch(directory)
    for await (const event of watcher) {
      let st, name, path
      if (event.eventType == 'change') {
        name = event.filename
        path = directory+'/'+name
        try {
          st = await stat(path)
        } catch (e) {
          console.log(e);
        }
        updateMetadata(fileMetadataMap, path, st)
      }
    }
  } catch (err) {
    throw err;
  }
}

async function newlineIndices(readable, offset = 0) {
  return new Promise((resolve, reject) => {
    let nlis = []
    readable.on('data', (bs) => {
      for (let i = 0; i < bs.length; ++i) {
        if (bs[i] == 10) nlis.push(offset + i)
        if (i == bs.length -1) offset += i+1
      }
    })
    readable.on('end', function() {
      resolve(nlis)
    })
  })
}

async function updateMetadata(map, path, stats) {
  const md = map[path],
        prevSize = md.size,
        currSize = stats.size
  const rs = createReadStream(path, { start: prevSize, end: currSize }),
        addl = await newlineIndices(rs, prevSize)
  md.size = stats.size
  md.lines = md.lines.concat(addl)
  return map
}
