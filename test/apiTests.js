process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'warning';

let chai = require('chai');
let chaiHttp = require('chai-http');
let sinonChai = require('sinon-chai');
let sinon = require('sinon');
let server = require('../app');
let should = chai.should();
let expect = require('chai').expect
let nock = require('nock');
const {LOG_LEVEL_WARNING} = require("../logger");
const logger = require('../logger');
const log = logger.logger;

const RUN_TEST_HOST = 'https://www.webpagetest.org';
const RUN_TEST_PATH = '/runtest.php';

chai.use(chaiHttp);
chai.use(sinonChai);

describe('API', () => {
    beforeEach(function () {
        nock.disableNetConnect();
        nock.enableNetConnect('127.0.0.1');
    });

    afterEach(function () {
        nock.cleanAll()
        nock.enableNetConnect()
    });

    describe('GET /version', () => {
        it('it should contain version property', (done) => {
            chai.request(server)
                .get('/version')
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.have.property('version');
                    done();
                });
        });
    });

    describe('POST /test/run', () => {
        it('it should return 200 on general WPT API failure', async () => {
            let spy = sinon.spy(log, 'error');

            const wpt = nock(RUN_TEST_HOST)
                .post(RUN_TEST_PATH)
                .query(true)
                .reply(500, 'Unknown WPT issue')

            let res = await chai.request(server)
                .post('/test/run')
                .send({mobile: false, url: "http://www.example.com/"})

            res.should.have.status(200);
            res.body.should.contain({status: 'error', message: 'WTP returned bad status with url http://www.example.com/'});
            expect(wpt.isDone()).to.be.true;

            expect(log.error).to.be.called;
            expect(500).to.equal(spy.getCall(0).args[1].thirdPartyErrorCode);
            expect("Unknown WPT issue").to.equal(spy.getCall(0).args[1].thirdPartyErrorBody);

            log.error.restore();
        });

        it('it should return 200 on soft error', async () => {
            sinon.spy(log, 'error');
            let spy = sinon.spy(log, 'warn');

            const wpt = nock(RUN_TEST_HOST)
                .post(RUN_TEST_PATH)
                .query(true)
                .reply(200, {statusCode: 400, statusText: 'unknown issue'})

            let res = await chai.request(server)
                .post('/test/run')
                .send({mobile: false, url: "http://www.example.com/"})

            res.should.have.status(200);
            res.body.should.contain({status: 'error', message: 'wpt_failure'});
            expect(wpt.isDone()).to.be.true;

            expect(log.warn).to.be.called;
            expect(log.error).to.not.be.called;
            expect(400).to.equal(spy.getCall(0).args[1].thirdPartyErrorCode);
            expect("unknown issue").to.equal(spy.getCall(0).args[1].thirdPartyErrorBody);

            log.error.restore();
            log.warn.restore();
        });
    });

});
