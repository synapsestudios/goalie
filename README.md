# goalie
[![CircleCI](https://circleci.com/gh/synapsestudios/goalie/tree/master.svg?style=svg)](https://circleci.com/gh/synapsestudios/goalie/tree/master)
Goalie is a hapi plugin that monitors requests for an `api-version` header and will return a 412 instead of running handlers when a version mismatch is detected.
