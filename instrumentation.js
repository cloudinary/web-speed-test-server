const opentelemetry = require('@opentelemetry/sdk-node');
const {Resource} = require('@opentelemetry/resources');
const {registerInstrumentations} = require('@opentelemetry/instrumentation');
const {HttpInstrumentation} = require('@opentelemetry/instrumentation-http');
const {ExpressInstrumentation} = require('@opentelemetry/instrumentation-express');
const {PrometheusExporter} = require('@opentelemetry/exporter-prometheus');

const {
    ATTR_SERVICE_NAME,
    ATTR_SERVICE_VERSION
} = require('@opentelemetry/semantic-conventions');

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

registerInstrumentations({
    instrumentations: [
        // Express instrumentation expects HTTP layer to be instrumented
        new HttpInstrumentation({
            ignoreIncomingRequestHook: (req) => {
                return req.connection.localPort === 6060;   // ignore incoming requests to prometheus
            },
            ignoreOutgoingRequestHook: (req) => {
                return ![   // we care about performance of outgoing requests to those hosts only
                    'www.webpagetest.org',
                    'api.cloudinary.com'
                ].includes(req.hostname);
            },
        }),
        new ExpressInstrumentation()
    ],
});
