const Boom = require('boom');

exports.register = (server, options, next) => {
  const compatabilityMethod = options.compatabilityMethod || 'strict';

  server.ext({
    type: 'onPreHandler',
    method: (request, reply) => {
      if (compatabilityMethod === 'strict' && request.headers['api-version'] && request.headers['api-version'] !== options.apiVersion) {
        reply(Boom.preconditionFailed());
      } else {
        reply.continue();
      }
    }
  });

  server.ext({
    type: 'onPreResponse',
    method: (request, reply) => {
      if (request.response.isBoom) {
        request.response.output.headers['api-version'] = options.apiVersion;
      } else {
        request.response.header('api-version', options.apiVersion);
      }

      return reply.continue();
    }
  });

  next();
};

exports.register.attributes = {
    pkg: require('../package.json')
};
