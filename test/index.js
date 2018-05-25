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
    it('appends api version response header when client semver is satisfied by the api', done => {
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

    it('responds with a 412 when the client semver is not satisfied by the api', done => {
      const apiVersion = 'v2.0.0';
      const server = makeServer({ apiVersion });
      server.inject({
        url: '/',
        headers: { 'api-version': '^v1.0.0' },
      }, res => {
        expect(res.statusCode).to.equal(412);
        expect(res.headers['api-version']).to.equal(apiVersion);
        done();
      });
    });

    it('does not fail spectacularly when the request api version is not a well formatted semver string', done => {
      const apiVersion = 'v2.0.0';
      const server = makeServer({ apiVersion });
      server.inject({
        url: '/',
        headers: { 'api-version': 'GOBBLEDEGOOK' },
      }, res => {
        expect(res.statusCode).to.equal(412);
        expect(res.headers['api-version']).to.equal(apiVersion);
        done();
      });
    });
  });

  describe('callback', () => {
    it('calls the callback with request api-version and current api version');
    it('appends api version response header when callback returns true');
    it('responds with a 412 when the callback returns false');
    it('replies with a 500 error when the callback throws errors');
  });
});
