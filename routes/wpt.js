'use strict';
const express = require('express');
const validUrl = require('valid-url');
const apiCaller = require('../wtp/apiCaller');



const wtp = (app) => {
    app.get('/test/:testId', (req, res) => {
        let testId = req.params.testId;
        apiCaller.getTestResults(testId, res);
    });



    app.post('/test/run' , (req, res) => {
        if (!req.body) {
            res.sendStatus(400);
            return;
        }
        let testUrl = req.body.url;
        if (!testUrl) {
            res.sendStatus(400);
            return;
        }
        if (!validUrl.isUri(testUrl)) {
            res.json({status: 'error',  message: 'URL is not valid'});
            return;
        }
        apiCaller.runWtpTest(testUrl, res);
    })
};

module.exports = wtp;
