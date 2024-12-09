const got = (...args) => import('got').then(({default: got}) => got(...args));
const config = require('config');
const {Mutex, withTimeout, E_TIMEOUT} = require('async-mutex');
const apiKeys = require('./apiKey');
const path = require("path");
const logger = require('../logger').logger;

const GET_LOCATIONS = 'http://www.webpagetest.org/getLocations.php?f=json';

class LocationSelector {
    constructor() {
        if (!LocationSelector.instance) {
            this.cachedAllLocations = [];
            this.location = config.get('wtp.locationSelector.defaultLocation');
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
            .filter(key => key.includes("_US_"))    // we only want US-based instances
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
    };

    async getLocation() {
        if (this.isExpired()) {
            try {
                await this.mutex.runExclusive(async () => {
                    if (this.isExpired()) {
                        await this.updateLocations();
                    }
                });
            } catch (e) {
                if (e === E_TIMEOUT) {
                    logger.error('Locations update is taking too long', e);
                }
            }
        }

        return this.location;
    }
}

const instance = new LocationSelector();
module.exports = instance;
