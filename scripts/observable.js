'use strict';
const Rx = require('rx');

var eventify = function (arr, callback) {
  arr.push = function (e) {
    Array.prototype.push.call(arr, e);
    callback(e);
  };
};

let arr = [];
Rx.Observable.create(observer => {

  setTimeout(() => {
    arr.push(5);
  }, 1000);

  arr.forEach(item => {
    observer.onNext(item);
  });
  eventify(arr, function (item) {
    observer.onNext(item);
  });
})
  .subscribe(x => {
    console.log('x가 와욧', x);
  });
