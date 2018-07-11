const Boom = require('boom');
const semver = require('semver');

const strictResolver = (request, h, options) => {
  return request.headers['api-version'] !== options.apiVersion
    ? Boom.preconditionFailed()
    : h.continue;
};

const semverResolver = (request, h, options) => {
  if (semver.satisfies(options.apiVersion, request.headers['api-version'])) {
    return h.continue;
  }
  return Boom.preconditionFailed();
};

const callbackResolver = (request, h, options) => {
  if (options.compatabilityMethod(request.headers['api-version'], options.apiVersion)) {
    return h.continue;
  }

  return Boom.preconditionFailed();
};

exports.plugin = {
  pkg: require('../package.json'),
  register: async (server, options) => {
    const compatabilityMethod = options.compatabilityMethod || 'semver';

    if (options.apiVersion) {
      server.ext({
        type: 'onPreHandler',
        method: (request, h) => {
          if (!request.headers['api-version']) {
            return h.continue;
          }

          let resolver;
          if (typeof compatabilityMethod === 'function') {
            resolver = callbackResolver;
          } else if (compatabilityMethod === 'strict') {
            resolver = strictResolver;
          } else {
            resolver = semverResolver;
          }

          return resolver(request, h, options);
        },
      });

      server.ext({
        type: 'onPreResponse',
        method: (request, h) => {
          if (request.response.isBoom) {
            request.response.output.headers['api-version'] = options.apiVersion;
          } else {
            request.response.header('api-version', options.apiVersion);
          }

          return h.continue;
        },
      });
    }
  },
};
