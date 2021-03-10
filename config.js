export { port, prefix, inputLength, cacheLength }


const port = process.env.PORT || 3142,
      prefix = process.env.DIR || './logs',
      cacheSize = Number(process.env.CACHE_SIZE),
      cacheLength = cacheSize ? cacheSize + 1 : Infinity,
      inputLength = 256
