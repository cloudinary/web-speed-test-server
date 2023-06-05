process.env.NODE_ENV = 'test';

let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();
let nock = require('nock');

const RUN_TEST_HOST = 'https://www.webpagetest.org';
const RUN_TEST_PATH = '/runtest.php';

chai.use(chaiHttp);

describe('API', () => {
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
        it('it should return 200 on general WPT API failure', (done) => {
            const scope = nock(RUN_TEST_HOST)
                .post(RUN_TEST_PATH)
                .reply(500, '')
                .persist();

            chai.request(server)
                .post('/test/run')
                .send({mobile:false, url:"http://www.example.com/"})
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.contain({ status: 'error', message: 'wpt_failure' });
                    done();
                });

            scope.persist(false);
        });

        it('it should return 200 on invalid wpt credentials', (done) => {
            const scope = nock(RUN_TEST_HOST)
                .post(RUN_TEST_PATH)
                .reply(400, 'Invalid API key. To continue running tests via the WebPageTest API, you\'ll need to update your current key for the enhanced WebPageTest API. Read more here: https://product.webpagetest.org/api')
                .persist();

            chai.request(server)
                .post('/test/run')
                .send({mobile:false, url:"http://www.example.com/"})
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.contain({ status: 'error', message: 'wpt_failure' });
                    done();
                });

            scope.persist(false);
        });
    });

});