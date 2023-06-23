## v1.5.2 (2023-06-23)

### Fixed
* Fix irrelevant activities filter and allow deletes and updates through
* Fixed unverifiable delete detection for duplicate deliveries

## v1.5.1 (2023-06-23)
Efficiency and compatibility updates
### Fixed
* Detect and bail out on irrelevant activities earlier in the flow to save work (several softwares seem to be spamming every known guppe actor with all their public activity)
* Fix cache retrieval of actor keys during signature verification
* Detect and bail out on unverifiable deletes before trying to fetch the actor
* Fix real ip address not logged behind reverse proxy
* Increase log storage
## v1.5.0 (2023-05-26)

### Added
* Update `activitypub-express` to add User-Agent headers to federation requests

## v1.4.0 (2023-03-17)

### Added
* Optional `ADMIN_SECRET` env var enables C2S API access with the given bearer token
* Optional `USE_ATTACHMENTS` env var to add Mastodon-style user attributes to groups

## v1.3.0 (2022-12-29)

* Change production swarm setup to use nginx for ssl-terminating reverse proxy due to renewal issues with @small-tech/auto-encrypt in in swarm mode
* Change swarm node labeling scheme to allow consolidation of all services on one machine
* Update activitypub-express to fix [a spec compliance issue](https://github.com/immers-space/activitypub-express/pull/83)

## v1.2.0 (2022-05-15)

* Fix: show correct domain name in guppe instructions on homepage
* Add: Support running behind SSL-terminating reverse proxy (PROXY_MODE environment variable)

## v1.1.0 (2022-05-1)

### Added

* Activate nodeinfo with software name and version
