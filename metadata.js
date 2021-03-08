import { createReadStream } from 'fs'
import { readdir, stat, watch } from 'fs/promises'
export { initMetadata }


async function initMetadata(directory) {
  try {
    let all = await readdir(directory)
    let map = {}
    let path, st, size, rs, nis
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
    installWatcher(directory, map)
    return map
  } catch (e) {
    console.log(`FATAL: failed to initialize "${directory}" (${e})`)
    throw e
  }
}

async function installWatcher(directory, fileMetadataMap) {
  try {
    const watcher = watch(directory)
    for await (const event of watcher) {
      let name, path, st, all
      name = event.filename
      path = directory+'/'+name
      try {
        st = await stat(path)
        fileMetadataMap = await updateFileMetadata(fileMetadataMap, path, st)
      } catch (e) {
        console.log(e);
        all = await readdir(directory)
        if (all.indexOf(name) == -1) delete fileMetadataMap[path]
      }
    }
  } catch (e) {
    console.log(`FATAL: failed to watch "${directory}" (${e})`)
    throw e;
  }
}

async function updateFileMetadata(map, path, stats) {
  const md = map[path],
        start = md ? md.size : 0,
        lines = md ? md.lines : [],
        rs = createReadStream(path, { start: start }),
        is = await newlineIndices(rs, start)
  map[path] = { size: stats.size, lines: lines.concat(is) }
  return map
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
