const got = (...args) => import('got').then(({default: got}) => got(...args));
const {Mutex} = require('async-mutex');
const apiKeys = require('./apiKey');
const path = require("path");
const logger = require('../logger').logger;

const GET_LOCATIONS = 'http://www.webpagetest.org/getLocations.php?f=json';

class LocationSelector {
    CACHE_TTL = 10;
    DEFAULT_LOCATION = 'IAD_US_01';

    constructor() {
        if (!LocationSelector.instance) {
            this.cachedAllLocations = [];
            this.location = this.DEFAULT_LOCATION;
            this.lastUpdated = null;
            this.mutex = new Mutex();
            LocationSelector.instance = this;
        }
        return LocationSelector.instance;
    }

    isExpired() {
        const now = Date.now();
        return (!this.lastUpdated || (now - this.lastUpdated) > this.CACHE_TTL * 1000);
    }

    async fetchLocations() {
        let options = {
            method: "GET",
            url: GET_LOCATIONS,
            headers: {'User-Agent': 'WebSpeedTest', 'X-WPT-API-KEY': apiKeys.get()},
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

    getLocationScore(location) {
        let metrics = location.PendingTests;

        // Idle + Testing ==> capacity
        if (metrics.Idle + metrics.Testing == 0) {
            return 1;   // no instances running, hopefully they will be spin up for our request?
        }

        return (metrics.HighPriority + metrics.Testing) / (metrics.Idle + metrics.Testing)
    }

    getBestLocationId(locations) {
        let selected = locations.reduce((acc, cur) => acc && this.getLocationScore(acc) < this.getLocationScore(cur) ? acc : cur);
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

        this.location = this.getBestLocationId(filtered);
        this.cachedAllLocations = filtered;
        this.lastUpdated = Date.now();
    };

    async getLocation() {
        if (this.isExpired()) {
            await this.mutex.runExclusive(async () => {
                if (this.isExpired()) {
                    await this.updateLocations();
                }
            });
        }

        return this.location;
    }
}

const instance = new LocationSelector();

module.exports = instance;
