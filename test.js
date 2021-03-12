import { blkBoundaryIter } from './reader.js'
import * as assert from 'assert'

let res = []
for (const b of blkBoundaryIter(3,10)) {
  res.push(b)
}
let expected = [9, 6, 3, 0]
console.assert(equalArrays(res, expected), `size<offset : %O != %O`, res, expected);

res = []
for (const b of blkBoundaryIter(10,3)) {
  res.push(b)
}
expected = [0]
console.assert(equalArrays(res, expected), `size>offset: %O != %O`, res, expected);

res = []
for (const b of blkBoundaryIter(3,3)) {
  res.push(b)
}
expected = [0]
console.assert(equalArrays(res, expected), `size=offset: %O != %O`, res, expected);


function equalArrays(a, b) {
  return a.length === b.length &&
    a.every((val, index) => val === b[index]);
}
