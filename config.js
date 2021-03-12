export { port, prefix, inputLength, cacheLength }


const port = process.env.PORT || 3142,
      prefix = process.env.DIR || './logs',
      cacheSize = Number(process.env.CACHE_SIZE),
      cacheLength = isNaN(cacheSize) ? 1000 : cacheSize,
      inputLength = 256
