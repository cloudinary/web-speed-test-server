"use strict";

const config = require('config');

function get() {
  const apiKeys = config.get('wtp.apiKey').split(',');
  const apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];
  return apiKey;
}

module.exports = {
  get
};
