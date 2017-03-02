'use strict';

const _ = require('lodash');

const API = require('../config/api');
const MAP = require('../config/textmap');
const Rx = require('rx');

const SECOND = 1000;
const DELAY_API_REQUEST = 10 * SECOND;
const DELAY_PUSH_TO_SERIAL = SECOND;

// for serial
const SerialPort = require('serialport');
const port = new SerialPort('/dev/ttyACM0', {
  baudRate: 57600
});
const ToAscii = require('./buffertest');
const moment = require('moment');

const portOpenObservable = Rx.Observable
  .create(observer => {
    port.on('open', function () {
      console.log('serial port opened');
      observer.onNext(undefined);
      observer.onCompleted();
    });
  });


var eventify = function (arr, callback) {
  arr.push = function (e) {
    Array.prototype.push.call(arr, e);
    callback(e);
  };
};


let messageQueue = [];
let writeEncodedDataObservable = Rx.Observable.create(observer => {
  messageQueue.forEach(item => {
    observer.onNext(item);
  });
  eventify(messageQueue, function (item) {
    observer.onNext(item);
  });
});


writeEncodedDataObservable.subscribe(x => {
  let encoded = ToAscii('64' + moment().format("hhmmss") + x);
  console.log('64' + moment().format("hhmmss") + x, encoded);
  port.write(encoded);
});

// for twitter
const Twitter = require('twitter-node-client').Twitter;

const twitter = new Twitter({
  'consumerKey': API.CONSUMER_KEY,
  'consumerSecret': API.CONSUMER_SECRET_KEY,
  'accessToken': API.ACCESS_TOKEN,
  'accessTokenSecret': API.ACCESS_TOKEN_SECRET,
  'callBackUrl': ''
});

// for database
const admin = require('firebase-admin');
const serviceAccount = require('../config/firebase.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://sawmac-27236.firebaseio.com'
});

let db = admin.database();
let ref = db.ref('/twitter');
let snapshot;
let cashedList;

ref.on("child_added", function (snap) {
  snapshot = snap;
  cashedList = snap.val();
});

// code start

let getTwitsObservable = Rx.Observable
  .create(observer => {
    setTimeout(() => {
      twitter.getSearch({
        'q': '#예술해커톤',
        'count': 20
      }, onError, (data) => {
        let result = JSON.parse(data).statuses;
        let next = result.map(x => {
          return { id: x.id, hashTags: x.entities.hashtags };
        });
        observer.onNext(next);
        observer.onCompleted();
      });
    }, DELAY_API_REQUEST);
  });

let firebaseObservable = Rx.Observable
  .create(observer => {
    ref.on('value', (snap) => {
      snapshot = snap;
      cashedList = snap.val();

      observer.onNext(snap.val());
      observer.onCompleted();
    }, (errorObject) => {
      observer.onError(errorObject);
    });
  });

portOpenObservable.flatMap((x) => {
  return firebaseObservable;
}).subscribe(x => {
  console.log('last ? ', x);
})

firebaseObservable.subscribe(value => {
  getTwitsObservable.repeat(100)
    .subscribe(x => {
      let publishDelay = DELAY_PUSH_TO_SERIAL;
      let publishCount = 0;
      // for time
      messageQueue.push(3);
      console.log('notify for time')

      x.forEach(item => {
        let pushFlag = true;
        _.forEach(cashedList, (cashedItem, key) => {
          if (cashedItem.id == item.id) {
            pushFlag = false;
          }
        });

        if (pushFlag) {
          ref.push({
            id: item.id
          });
          let status = miningTagData(item.hashTags);

          publishCount += 1;
          setTimeout(() => {
            messageQueue.push(status);
          }, publishDelay * publishCount);
        }

      });
    });
});

function miningTagData(hashTags) {
  console.log(hashTags);

  let tags = _.chain(hashTags)
    .map(hashTag => {
      return hashTag.text;
    })
    .value();

  let statusResult = [];
  _.forEach(MAP, (status, statusMapKey) => {
    // status = ["행복", "행복하다"]
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
  return statusResult.indexOf(maxObj);
}

function onError(err, response, body) {
  console.log('onError');
  console.log(err);
}
