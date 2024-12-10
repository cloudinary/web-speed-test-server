const opentelemetry = require('@opentelemetry/sdk-node');
const {Resource} = require('@opentelemetry/resources');
const {
    ATTR_SERVICE_NAME,
    ATTR_SERVICE_VERSION
} = require('@opentelemetry/semantic-conventions');
const {PrometheusExporter} = require('@opentelemetry/exporter-prometheus');
const sdk = new opentelemetry.NodeSDK({
    resource: new Resource({
        [ATTR_SERVICE_NAME]: 'web-speed-test-server',
        [ATTR_SERVICE_VERSION]: require('./package.json').version
    }),
    metricReader: new PrometheusExporter({
        port: 6060,
    }),
});
sdk.start();
