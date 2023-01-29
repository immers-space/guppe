## Unreleased

* Change production swarm setup to use nginx for ssl-terminating reverse proxy due to renewal issues with @small-tech/auto-encrypt in in swarm mode
* Change swarm node labeling scheme to allow consolidation of all services on one machine
* Update activitypub-express to fix [a spec compliance issue](https://github.com/immers-space/activitypub-express/pull/83)

## v1.2.0 (2022-05-15)

* Fix: show correct domain name in guppe instructions on homepage
* Add: Support running behind SSL-terminating reverse proxy (PROXY_MODE environment variable)

## v1.1.0 (2022-05-1)

### Added

* Activate nodeinfo with software name and version
