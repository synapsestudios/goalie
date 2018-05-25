const Hapi = require('hapi');
const Goalie = require('../lib');
const { expect } = require('code');
const { describe, it } = exports.lab = require('lab').script();

const makeServer = (options, cb) => {
  const server = new Hapi.Server();
  server.connection({ port: 80 });
  server.register({
    register: Goalie,
    options,
  }, cb);

  server.route({ method: 'GET', path: '/', handler: (request, reply) => reply('Success!') });
  return server;
}

describe('smoke test', () => {
  it('registers without errors', done => {
    makeServer({}, err => {
      expect(err).to.not.exist();
      done();
    });
  });
});

describe('Goalie', () => {
  it('appends api version response header when api-version header is not present', done => {
    const apiVersion = '1.0.0';
    const server = makeServer({ apiVersion });
    server.inject('/', res => {
      expect(res.headers['api-version']).to.equal(apiVersion);
      done();
    })
  });

  describe('strict', () => {
    it('appends api version response header when client and api versions match exactly');
    it('responds with a 412 when the client and api versions do not match exactly');
  });

  describe('semver', () => {
    it('appends api version response header when client and api major version match exactly');
    it('responds with a 412 when the client and api major version do not match exactly');
  });

  describe('callback', () => {
    it('calls the callback with request api-version and current api version');
    it('appends api version response header when callback returns true');
    it('responds with a 412 when the callback returns false');
  })
});

