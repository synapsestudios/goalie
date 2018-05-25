const Hapi = require('hapi');
const Goalie = require('../lib');
const { expect } = require('code');
const { describe, it } = exports.lab = require('lab').script();

describe('smoke test', () => {
  it('registers without errors', done => {
    const server = new Hapi.Server();
    server.register({
      register: Goalie,
    }, err => {
      expect(err).to.not.exist();
      done();
    });
  });
});

describe('Goalie', () => {
  it('appends api version response header when api-version header is not present');

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
  });
});

