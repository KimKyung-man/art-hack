'use strict';

const _ = require('lodash');

const API = require('../config/api');
const MAP = require('../config/textmap');
const Rx = require('rx');

const moment = require('moment');

// for twitter
const Twitter = require('twitter-node-client').Twitter;

const twitter = new Twitter({
  'consumerKey': API.CONSUMER_KEY,
  'consumerSecret': API.CONSUMER_SECRET_KEY,
  'accessToken': API.ACCESS_TOKEN,
  'accessTokenSecret': API.ACCESS_TOKEN_SECRET,
  'callBackUrl': ''
});

// code start

let getTwitsObservable = Rx.Observable
  .create(observer => {
    setTimeout(() => {
      twitter.getSearch({
        'q': '#자살',
        'count': 100
      }, onError, (data) => {
        let result = JSON.parse(data).statuses;
        let next = result.map(x => {
          return { id: x.id, hashTags: x.entities.hashtags };
        });
        observer.onNext(next);
        observer.onCompleted();
      });
    }, 2000);
  });


let tagList = [];
getTwitsObservable.subscribe(x => {
  x.forEach(item => {
    let tags = _.chain(item.hashTags)
      .map(hashTag => {
        return hashTag.text;
      })
      .value();
    tagList.push(tags);
  });

  console.log(_.uniq(_.flattenDeep(tagList)));
});


function onError(err, response, body) {
  console.log('onError');
  console.log(err);
}