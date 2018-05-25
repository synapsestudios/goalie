const Hapi = require('hapi');
const Goalie = require('../lib');
const Boom = require('boom');
const { expect } = require('code');
const { describe, it } = exports.lab = require('lab').script();

const makeServer = async options => {
  const server = Hapi.Server({ port: 80 });
  await server.register({
    plugin: Goalie,
    options,
  });

  server.route({ method: 'GET', path: '/', handler: (request, reply) => 'Success!' });
  return server;
};

describe('smoke test', () => {
  it('registers without errors', async () => {
    await makeServer({});
  });
});

describe('Goalie', () => {
  it('does nothing if api version is not supplied', async () => {
    const server = await makeServer();
    const res = await server.inject('/');
    expect(res.statusCode).to.equal(200);
    expect(res.headers['api-version']).to.not.exist();
  });

  it('appends api version response header when api-version request header is not present', async () => {
    const apiVersion = 'v1.0.0';
    const server = await makeServer({ apiVersion });
    const res = await server.inject('/');

    expect(res.statusCode).to.equal(200);
    expect(res.headers['api-version']).to.equal(apiVersion);
  });

  it('appends api-version to error response', async () => {
    const server = Hapi.Server({ port: 80 });
    await server.register({
      plugin: Goalie,
      options: { apiVersion: 'v1.0.0' },
    });

    server.route({ method: 'GET', path: '/', handler: (request, reply) => Boom.badRequest() });

    const res = await server.inject('/');
    expect(res.statusCode).to.equal(400);
    expect(res.headers['api-version']).to.equal('v1.0.0');
  });

  describe('strict', () => {
    it('appends api version response header when client and api versions match exactly', async () => {
      const apiVersion = 'v1.0.0';
      const server = await makeServer({ apiVersion, compatabilityMethod: 'strict' });
      const res = await server.inject({
        url: '/',
        headers: { 'api-version': apiVersion },
      });

      expect(res.statusCode).to.equal(200);
      expect(res.headers['api-version']).to.equal(apiVersion);
    });

    it('responds with a 412 when the client and api versions do not match exactly', async () => {
      const apiVersion = 'v1.0.0';
      const server = await makeServer({ apiVersion, compatabilityMethod: 'strict' });
      const res = await server.inject({
        url: '/',
        headers: { 'api-version': 'not-v1.0.0' },
      });

      expect(res.statusCode).to.equal(412);
      expect(res.headers['api-version']).to.equal(apiVersion);
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

      it(`returns ${testCase.code} when apiVersion is ${testCase.apiVersion} and request version is ${testCase.requestVersion}`, async () => {
        const server = await makeServer({ apiVersion: testCase.apiVersion });
        const res = await server.inject({
          url: '/',
          headers: { 'api-version': testCase.requestVersion },
        });
        expect(res.statusCode).to.equal(testCase.code);
        expect(res.headers['api-version']).to.equal(testCase.apiVersion);
      });
    }
  });

  describe('callback', () => {
    it('calls the callback with request api-version and current api version', done => {
      let called = false;
      const apiVersion = 'v1.0.0';
      const requestVersion = 'v1.2.3';
      const server = makeServer({
        apiVersion,
        compatabilityMethod: (testRequestVersion, testApiVersion) => {
          called = true;
          expect(testApiVersion).to.equal(apiVersion);
          expect(testRequestVersion).to.equal(requestVersion);
        },
      });

      server.inject({
        url: '/',
        headers: { 'api-version': requestVersion },
      }, res => {
        expect(called).to.be.true();
        done();
      });
    });

    it('appends api version response header when callback returns true', done => {
      const apiVersion = 'v1.0.0';
      const server = makeServer({
        apiVersion,
        compatabilityMethod: () => true,
      });

      server.inject({
        url: '/',
        headers: { 'api-version': apiVersion },
      }, res => {
        expect(res.statusCode).to.equal(200);
        expect(res.headers['api-version']).to.equal(apiVersion);
        done();
      });
    });

    it('responds with a 412 when the callback returns false', done => {
      const apiVersion = 'v1.0.0';
      const server = makeServer({
        apiVersion,
        compatabilityMethod: () => false,
      });

      server.inject({
        url: '/',
        headers: { 'api-version': apiVersion },
      }, res => {
        expect(res.statusCode).to.equal(412);
        expect(res.headers['api-version']).to.equal(apiVersion);
        done();
      });
    });
  });
});
