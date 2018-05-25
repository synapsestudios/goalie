# Goalie
[![CircleCI](https://circleci.com/gh/synapsestudios/goalie/tree/master.svg?style=svg)](https://circleci.com/gh/synapsestudios/goalie/tree/master)

Goalie will append an `api-version` header to all of your api responses. In addition, it will monitor incoming response headers for an `api-version` header. If the client provides an api version that is incompatible with the current api version then the request will be aborted and a 412 response will be returned. In this way you can prevent the api from attempting to run known incompatible requests.

## Install

```
npm i @synapsestudios/goalie --save
```

## Usage

Add goalie as a plugin to your hapi server:

```
const Hapi = require('hapi');
const Goalie = require('../lib');

const server = new Hapi.Server();

server.register({
  register: Goalie,
  { apiVersion: 'v1.0.0' },
});
```

### Compatability Methods

By default goalie uses the npm semver module to determine version compatability. If your request `api-version` is "^v1.0.0" and the api's actual version is "v1.0.2" then goalie will not abort that request. In addition to semver, you can use 'strict' mode which uses strict equality to determine if versions match (requestVersion === apiVersion), or you can provide a callback to resolve version compatibility yourslef.

```
// use strict
server.register({
  register: Goalie,
  {
    apiVersion: 'v1.0.0',
    compatabilityMethod: 'strict',
  }
});


// or use a callback
server.register({
  register: Goalie,
  {
    apiVersion: 'v1.0.0',
    compatabilityMethod: (requestVersion, apiVersion) => {
      // determine whether or not the request version is compatible
      return true; // return false to abort the request and return 412
    },
  }
});
```

## Options

| name | description |
| ---- | ----------- |
| apiVersion | The current version of the api |
| compatibilyMethod | The method that goalie will use to determine version compatability. Defaults to 'semver' |
