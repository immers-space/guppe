# Gup.pe

Social groups for the fediverse - making it easy to connect and meet new people based on shared interests without the manipulation of your attention to maximize ad revenue nor the walled garden lock-in of capitalist social media.

This server-2-server ActivityPub implementation adds decentralized, federated "groups" support across all ActivityPub compliant social media networks. Users join groups by following group-type actors on Guppe servers and contribute to groups by mentioning those same actors in a post. Guppe group actors will automatically forward posts they receive to all group members so that everyone in the group sees any post made to the group. Guppe group actors' profiles (e.g. outboxes) also serve as a group discussion history.
Creation of new groups is automatic, users simply search for or mention a new group and it will be created.

## Guide and [Support Guppe Groups](https://opencollective.com/guppe-groups)

Guppe Groups adds simple social groups to Mastodon and other federated social networks. I created Guppe because I had moved all my online social activity to Mastodon to rid myself of the manipulation of extractive social platforms, but I missed the ability to connect with new people around shared interests using groups features that those platforms offer. It started in 2019 as a simple demo to help me learn ActivityPub in order to build Immers Space, the fediverse app for 3D immersive content, but I've kept it going because so many people find it useful.

In 2022, with the unprecedented influx of traffic to Mastodon from people leaving Twitter, the cost of operating Guppe has risen from $10/month to over $100/month as it now serves 4,000 requests per minute during peak times. That's more than I can justify spending on this hobby horse, so, with some prompting from Guppe users, I've set up an [Open Collective page](https://opencollective.com/guppe-groups) to allow contributions - with a twist.

I fundamentally do not believe that being a programmer gives me any special right to make decisions for others, and I recognize that the interests of the operator of a social app often conflict with the interests of the users of that app. That's why we invested in consultants and legal counsel to develop a [cooperative governance model for Immers Space](https://opencollective.com/immers-space) that shares power between the workers and the users of the software, and Immers Space will now manage Guppe with a similar model.

* Your contributions to Guppe on Open Collective will count as membership dues
* Contributions received in excess of operating costs will be used to fund development hours to improve Guppe and add new features
* Development decisions will be made democratically through member votes on our Loomio group

[![Guppe Members](https://opencollective.com/guppe-groups/tiers/member.svg?avatarHeight=36&width=600)](https://opencollective.com/guppe-groups)


## Tech stack

Mostly powered by [activitypub-express](https://github.com/immers-space/activitypub-express)
from [Immers Space](https://web.immers.space).
The gup.pe server app, `index.js` is  200 lines of code,
just adding the auto-create actor, auto-accept follow, and auto-boost from inbox behaviors
to the base apex setup.

There's also an HTML front-end using Vue (`/web`) to display popular groups and provide
fallback user profile discovery.

## Installation

Guppe uses Docker Swarm for easy load balancing Web server replicas

```
git clone https://github.com/wmurphyrd/guppe.git
cd guppe
cp .env.defaults .env
export DOMAIN=yourdomain.com
echo DOMAIN=$DOMAIN >> .env
echo ALLOWED_DOMAINS=$DOMAIN >> .env
echo SITES='"'$DOMAIN=guppe:8085'"' >> .env
docker swarm init --advertise-addr 127.0.0.1
# all on one node for simple setup or split these onto different nodes for a distributed swarm
docker node update --label-add web=true --label-add database=true --label-add delivery=true $(hostname)
docker stack deploy --compose-file docker-compose.yml guppe
```

## Updating

Backup database:

```
docker-compose exec -T mongodb sh -c 'mongodump --archive' > guppe.dump
```

Fetch latest code & restart server:

```
git pull
docker stack deploy --compose-file docker-compose.yml guppe
```

## Optional configuration

Additional values can be set in `.env` file

| Setting | Description |
| --- | --- |
| PROXY_MODE | Enable use behind an SSL-terminating proxy or load balancer, serves over http instead of https and sets Express `trust proxy` setting to the value of `PROXY_MODE` (e.g. `1`, [other options](https://expressjs.com/en/guide/behind-proxies.html)) See note. |

**Notes on use with a reverse proxy**: When setting proxyMode, you must ensure your reverse proxy sets the following headers: X-Forwarded-For, X-Forwarded-Host, and X-Forwarded-Proto (example for nginx below).

```
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Host $host;
proxy_set_header X-Forwarded-Proto $scheme;
```

## License

Copyright (c) 2021 William Murphy. Licensed under the AGPL-3
