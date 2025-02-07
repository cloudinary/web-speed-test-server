const got = (...args) => import('got').then(({default: got}) => got(...args));
const config = require('config');
const {Mutex, withTimeout, E_TIMEOUT} = require('async-mutex');
const apiKeys = require('./apiKey');
const path = require("path");
const opentelemetry = require("@opentelemetry/api");
const e = require("express");
const logger = require('../logger').logger;

const GET_LOCATIONS = 'http://www.webpagetest.org/getLocations.php?f=json';

const WstMeter = opentelemetry.metrics.getMeter('default');
const locationMetrics = {
    total: WstMeter.createGauge('location.total'),
    lastUpdate: WstMeter.createGauge('location.last_update'),
    ratio: WstMeter.createGauge('location.ratio'),
    score: WstMeter.createGauge('location.score'),
    selected: WstMeter.createGauge('location.selected'),
    agent: {
        total: WstMeter.createGauge('location.agent.total'),
        idle: WstMeter.createGauge('location.agent.idle'),
        queued: WstMeter.createGauge('location.agent.queued'),
        highprio: WstMeter.createGauge('location.agent.highprio'),
        lowprio: WstMeter.createGauge('location.agent.lowprio'),
        testing: WstMeter.createGauge('location.agent.testing'),
        blocking: WstMeter.createGauge('location.agent.blocking')
    },
};

class LocationSelector {
    constructor() {
        if (!LocationSelector.instance) {
            this.enabled = config.get('wtp.locationSelector.enabled');
            this.cachedAllLocations = [];
            this.location = config.get('wtp.locationSelector.defaultLocation');
            this.allowedLocationsRegex = new RegExp(config.get('wtp.locationSelector.allowedLocationsRegex'));
            this.lastUpdated = null;
            this.mutex = withTimeout(new Mutex(), config.get('wtp.locationSelector.updateTimeout') * 1000);
            LocationSelector.instance = this;
        }
        return LocationSelector.instance;
    }

    isExpired() {
        const now = Date.now();
        return (!this.lastUpdated || (now - this.lastUpdated) > config.get('wtp.locationSelector.cacheTtl') * 1000);
    }

    async fetchLocations() {
        let options = {
            method: "GET",
            url: GET_LOCATIONS,
            headers: {'User-Agent': 'WebSpeedTest', 'X-WPT-API-KEY': apiKeys.getRandom()},
        };
        let response;
        let rollBarMsg = {};
        try {
            response = await got(options);
            const {statusCode, body} = response;
            let bodyJson = JSON.parse(body);
            rollBarMsg = {thirdPartyErrorCode: response.statusCode, file: path.basename((__filename))};
            if (statusCode !== 200) {
                rollBarMsg.thirdPartyErrorBody = bodyJson;
                logger.error('WPT returned bad status', rollBarMsg);
                return;
            }
            return bodyJson.data;
        } catch (error) {
            logger.critical('Error fetching WTP locations', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        }
    };

    getLocationScore(loc) {
        // no instances running, hopefully they will be spin up for our request?
        if (this.getLocationCapacity(loc) == 0) {
            return 1;
        }

        let metrics = loc.PendingTests;
        return (metrics.HighPriority + metrics.Testing) / (metrics.Idle + metrics.Testing)
    }

    getLocationCapacity(loc) {
        return loc.PendingTests.Idle + loc.PendingTests.Testing;
    }

    getBestLocationId(locations) {
        let selected = locations.reduce((acc, cur) => {
            // if nothing to compare to, use current value
            if (!acc) {
                return cur;
            }

            // if acc less loaded
            if (acc.score < cur.score) {
                return acc;
            }

            // if cur less loaded
            if (acc.score > cur.score) {
                return cur;
            }

            // if same load on acc and cur
            // then choose the one with bigger capacity (Idle + Testing)
            return this.getLocationCapacity(acc) > this.getLocationCapacity(cur) ? acc : cur;
        });

        return selected.location;
    }

    async updateLocations() {
        const newLocations = await this.fetchLocations();
        if (!newLocations) {
            return
        }

        const filtered = Object.keys(newLocations)
            .filter(key => this.allowedLocationsRegex.test(key))
            .reduce((arr, key) => {
                return [...arr, newLocations[key]];
            }, []);

        if (filtered.length === 0) {
            return
        }

        // enrich locations with our internal score
        filtered.forEach((loc) => {
            loc.score = this.getLocationScore(loc);
        });

        this.location = this.getBestLocationId(filtered);
        this.cachedAllLocations = filtered;
        this.lastUpdated = Date.now();

        // telemetry
        locationMetrics.total.record(this.cachedAllLocations.length);
        locationMetrics.lastUpdate.record(this.lastUpdated);
        this.cachedAllLocations.forEach((loc) => {
            let labels = {location: loc.location};

            locationMetrics.ratio.record(loc.PendingTests.TestAgentRatio, labels);
            locationMetrics.score.record(loc.score, labels);

            locationMetrics.selected.record(loc.location === this.location ? 1 : 0, labels);

            locationMetrics.agent.total.record(loc.PendingTests.Total, labels);
            locationMetrics.agent.idle.record(loc.PendingTests.Idle, labels);
            locationMetrics.agent.queued.record(loc.PendingTests.Queued, labels);
            locationMetrics.agent.highprio.record(loc.PendingTests.HighPriority, labels);
            locationMetrics.agent.lowprio.record(loc.PendingTests.LowPriority, labels);
            locationMetrics.agent.testing.record(loc.PendingTests.Testing, labels);
            locationMetrics.agent.blocking.record(loc.PendingTests.Blocking, labels);
        });
    };

    async getLocation() {
        if (this.enabled && this.isExpired()) {
            try {
                logger.info('Update WPT locations');
                await this.mutex.runExclusive(async () => {
                    if (this.isExpired()) {
                        await this.updateLocations();
                    }
                });
            } catch (e) {
                if (e === E_TIMEOUT) {
                    logger.error('Locations update is taking too long', e);
                }
            } finally {
                logger.info('Finished WPT locations update');
            }
        }

        return this.location;
    }
}

const instance = new LocationSelector();
module.exports = instance;
