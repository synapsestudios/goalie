const Boom = require('boom');
const semver = require('semver');

const strictResolver = (request, reply, options) => {
  return request.headers['api-version'] !== options.apiVersion
    ? reply(Boom.preconditionFailed())
    : reply.continue();
};

const semverResolver = (request, reply, options) => {
  if (semver.satisfies(options.apiVersion, request.headers['api-version'])) {
    return reply.continue();
  }
  return reply(Boom.preconditionFailed());
};

const callbackResolver = (request, reply, options) => {
  if (options.compatabilityMethod(request.headers['api-version'], options.apiVersion)) {
    return reply.continue();
  }
  return reply(Boom.preconditionFailed());
};

exports.register = (server, options, next) => {
  const compatabilityMethod = options.compatabilityMethod || 'semver';

  server.ext({
    type: 'onPreHandler',
    method: (request, reply) => {
      if (!request.headers['api-version']) {
        return reply.continue();
      }

      let resolver;
      if (typeof compatabilityMethod === 'function') {
        resolver = callbackResolver;
      } else if (compatabilityMethod === 'strict') {
        resolver = strictResolver;
      } else {
        resolver = semverResolver;
      }

      resolver(request, reply, options);
    },
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
    },
  });

  next();
};

exports.register.attributes = {
  pkg: require('../package.json'),
};
