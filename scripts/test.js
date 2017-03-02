'use strict';

const _ = require('lodash');
const MAP = require('../config/textmap');

let hashTags = [
  { text: '설', indices: [17, 19] },
  { text: '유후', indices: [20, 23] },
  { text: '웃음꽃', indices: [24, 28] },
  { text: '예술', indices: [29, 32] },
  { text: '행복해요', indices: [33, 38] },
  { text: '행복하다', indices: [33, 38] },
  { text: '불행', indices: [33, 38] },
  { text: '하아', indices: [33, 38] },
  { text: '야호', indices: [33, 38] },
  { text: '행복', indices: [33, 38] }
];


let tags = _.chain(hashTags)
  .map(hashTag => {
    return hashTag.text;
  })
  .value();

let statusResult = [];
_.forEach(MAP, (status, statusMapKey) => {
  // status = ["행복", "행복하다"]
  console.log('------');
  let count = 0;

  _.forEach(status, (item) => {
    let isFinded = !!_.find(tags, (tag) => {
      return tag === item;
    });
    count = (isFinded) ? count + 1 : count;
  });
  statusResult.push(count);
});
let maxObj = _.max(statusResult, (obj) => {
  return obj.number;
});
let maxIndex = statusResult.indexOf(maxObj);
console.log(maxIndex);

