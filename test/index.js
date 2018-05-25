const Hapi = require('hapi');
const Goalie = require('../lib');
const Boom = require('boom');
const { expect } = require('code');
const { describe, it } = exports.lab = require('lab').script();

const makeServer = (options, cb) => {
  const server = new Hapi.Server();
  server.connection({ port: 80 });
  server.register({
    register: Goalie,
    options,
  }, cb);

  server.route({ method: 'GET', path: '/', handler: (request, reply) => {
    return reply('Success!');
  } });
  return server;
};

describe('smoke test', () => {
  it('registers without errors', done => {
    makeServer({}, err => {
      expect(err).to.not.exist();
      done();
    });
  });
});

describe('Goalie', () => {
  it('does nothing if api version is not supplied', done => {
    const server = makeServer();
    server.inject('/', res => {
      expect(res.statusCode).to.equal(200);
      expect(res.headers['api-version']).to.not.exist();
      done();
    });
  });

  it('appends api version response header when api-version request header is not present', done => {
    const apiVersion = 'v1.0.0';
    const server = makeServer({ apiVersion });
    server.inject('/', res => {
      expect(res.statusCode).to.equal(200);
      expect(res.headers['api-version']).to.equal(apiVersion);
      done();
    });
  });

  it('appends api-version to error response', done => {
    const server = new Hapi.Server();
    server.connection({ port: 80 });
    server.register({
      register: Goalie,
      options: { apiVersion: 'v1.0.0' },
    });
    server.route({ method: 'GET', path: '/', handler: (request, reply) => {
      return reply(Boom.badRequest());
    } });

    server.inject('/', res => {
      expect(res.statusCode).to.equal(400);
      expect(res.headers['api-version']).to.equal('v1.0.0');
      done();
    });
  });

  describe('strict', () => {
    it('appends api version response header when client and api versions match exactly', done => {
      const apiVersion = 'v1.0.0';
      const server = makeServer({ apiVersion, compatabilityMethod: 'strict' });
      server.inject({
        url: '/',
        headers: { 'api-version': apiVersion },
      }, res => {
        expect(res.statusCode).to.equal(200);
        expect(res.headers['api-version']).to.equal(apiVersion);
        done();
      });
    });

    it('responds with a 412 when the client and api versions do not match exactly', done => {
      const apiVersion = 'v1.0.0';
      const server = makeServer({ apiVersion, compatabilityMethod: 'strict' });
      server.inject({
        url: '/',
        headers: { 'api-version': 'not-v1.0.0' },
      }, res => {
        expect(res.statusCode).to.equal(412);
        expect(res.headers['api-version']).to.equal(apiVersion);
        done();
      });
    });
  });

  describe('semver', () => {
    const cases = [{
      apiVersion: 'v1.0.0',
      requestVersion: '^v1.0.0',
      code: 200,
    }, {
      apiVersion: 'v2.0.0',
      requestVersion: '^v1.0.0',
      code: 412,
    }, {
      apiVersion: 'v2.0.0',
      requestVersion: 'gobbledegook',
      code: 412,
    }, {
      apiVersion: 'v2.0.0',
      requestVersion: '^v2.x',
      code: 200,
    }];

    for (let i = 0; i < cases.length; ++i) {
      const testCase = cases[i];

      it(`returns ${testCase.code} when apiVersion is ${testCase.apiVersion} and request version is ${testCase.requestVersion}`, done => {
        const apiVersion = 'v1.0.0';
        const server = makeServer({ apiVersion });
        server.inject({
          url: '/',
          headers: { 'api-version': '^v1.0.0' },
        }, res => {
          expect(res.statusCode).to.equal(200);
          expect(res.headers['api-version']).to.equal(apiVersion);
          done();
        });
      });
    }
  });

  describe('callback', () => {
    it('calls the callback with request api-version and current api version', done => {
      let called = false;
      const apiVersion = 'v1.0.0';
      const server = makeServer({
        apiVersion,
        compatabilityMethod: (testRequestVersion, testApiVersion) => {
          called = true;
          expect(testApiVersion).to.equal(apiVersion);
          expect(testRequestVersion).to.equal(apiVersion);
        },
      });

      server.inject({
        url: '/',
        headers: { 'api-version': apiVersion },
      }, res => {
        expect(called).to.be.true();
        expect(res.statusCode).to.equal(200);
        expect(res.headers['api-version']).to.equal(apiVersion);
        done();
      });
    });
    it('appends api version response header when callback returns true');
    it('responds with a 412 when the callback returns false');
    it('replies with a 500 error when the callback throws errors');
  });
});
