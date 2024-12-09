"use strict";

const config = require('config');

function getRandom() {
  const apiKeys = config.get('wtp.apiKey').split(',');
  const apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];
  return apiKey;
}

module.exports = {
  getRandom: getRandom
};
