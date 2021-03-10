# TailD

## Getting Started

### Run
```
node app.js
```
This project uses only built-in node libraries.

### Configuration - Environment Variables
`PORT` sets the listen port (default `3142`)

`DIR` sets the log file directory path (relative or absolute, default `./logs`)

`CACHE_SIZE` sets the number of line indexes to cache per file (~10 bytes per line per file)

### Use
```
curl -G localhost:3142/nginx_logs --data-urlencode lines=100 --data-urlencode pattern=404
```
e.g. request the last 100 lines of `./logs/nginx_logs`, filter lines not containing the string `404`
