require('dotenv').config()
const path = require('path')
const express = require('express')
const MongoClient = require('mongodb').MongoClient
const fs = require('fs')
const https = require('https')
const http = require('http')
const morgan = require('morgan')
const history = require('connect-history-api-fallback')
const { onShutdown } = require('node-graceful-shutdown')
const ActivitypubExpress = require('activitypub-express')

const { version } = require('./package.json')
const { DOMAIN, KEY_PATH, CERT_PATH, CA_PATH, PORT_HTTPS, DB_URL, DB_NAME, PROXY_MODE, ADMIN_SECRET, USE_ATTACHMENTS } = process.env

const app = express()
const client = new MongoClient(DB_URL)
const sslOptions = {
  key: KEY_PATH && fs.readFileSync(path.join(__dirname, KEY_PATH)),
  cert: CERT_PATH && fs.readFileSync(path.join(__dirname, CERT_PATH)),
  ca: CA_PATH && fs.readFileSync(path.join(__dirname, CA_PATH))
}
const icon = {
  type: 'Image',
  mediaType: 'image/jpeg',
  url: `https://${DOMAIN}/f/guppe.png`
}

const routes = {
  actor: '/u/:actor',
  object: '/o/:id',
  activity: '/s/:id',
  inbox: '/u/:actor/inbox',
  outbox: '/u/:actor/outbox',
  followers: '/u/:actor/followers',
  following: '/u/:actor/following',
  liked: '/u/:actor/liked',
  collections: '/u/:actor/c/:id',
  blocked: '/u/:actor/blocked',
  rejections: '/u/:actor/rejections',
  rejected: '/u/:actor/rejected',
  shares: '/s/:id/shares',
  likes: '/s/:id/likes'
}
const apex = ActivitypubExpress({
  name: 'Guppe Groups',
  version,
  domain: DOMAIN,
  actorParam: 'actor',
  objectParam: 'id',
  itemsPerPage: 100,
  // delivery done in workers only in production
  offlineMode: process.env.NODE_ENV === 'production',
  context: require('./data/context.json'),
  routes
})

app.use(
  morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status ":referrer" ":user-agent"'),
  express.json({ type: apex.consts.jsonldTypes }),
  apex,
  function checkAdminKey (req, res, next) {
    if (ADMIN_SECRET && req.get('authorization') === `Bearer ${ADMIN_SECRET}`) {
      res.locals.apex.authorized = true
    }
    next()
  }
)

async function createGuppeActor (...args) {
  const actor = await apex.createActor(...args)
  if (USE_ATTACHMENTS) {
    actor.attachment = require('./data/attachments.json')
  }
  return actor
}

// Create new groups on demand whenever someone tries to access one
async function actorOnDemand (req, res, next) {
  const actor = req.params.actor
  if (!actor) {
    return next()
  }
  const actorIRI = apex.utils.usernameToIRI(actor)
  try {
    if (!(await apex.store.getObject(actorIRI)) && actor.length <= 255) {
      console.log(`Creating group: ${actor}`)
      const summary = `I'm a group about ${actor}. Follow me to get all the group posts. Tag me to share with the group. Create other groups by searching for or tagging @yourGroupName@${DOMAIN}`
      const actorObj = await createGuppeActor(actor, `${actor} group`, summary, icon, 'Group')
      await apex.store.saveObject(actorObj)
    }
  } catch (err) { return next(err) }
  next()
}
const acceptablePublicActivities = ['delete', 'update']
apex.net.inbox.post.splice(
  // just after standardizing the jsonld
  apex.net.inbox.post.indexOf(apex.net.validators.jsonld) + 1,
  0,
  function inboxLogger (req, res, next) {
    try {
      console.log('%s from %s to %s', req.body.type, req.body.actor?.[0], req.params[apex.actorParam])
    } finally {
      next()
    }
  },
  // Lots of servers are delivering inappropriate activities to Guppe, move the filtering up earlier in the process to save work
  function inboxFilter (req, res, next) {
    try {
      const groupIRI = apex.utils.usernameToIRI(req.params[apex.actorParam])
      const activityAudience = apex.audienceFromActivity(req.body)
      const activityType = req.body.type?.toLowerCase()
      const activityObject = req.body.object?.[0]
      if (
        !activityAudience.includes(groupIRI) &&
        activityObject !== groupIRI &&
        !acceptablePublicActivities.includes(activityType)
      ) {
        console.log('Ignoring irrelevant activity sent to %s: %j', groupIRI, req.body)
        return res.status(202).send('Irrelevant activity ignored')
      }
    } catch (err) {
      console.warn('Error performing prefilter:', err)
    }
    next()
  }
)
// Do not boost posts from servers who abuse the service.
apex.net.inbox.post.splice(
  // Blocked domain check is inserted into apex inbox route right after the sender is verified
  apex.net.inbox.post.indexOf(apex.net.security.verifySignature) + 1,
  0,
  async function rejectBlockedDomains (req, res, next) {
    try {
      const url = new URL(res.locals.apex.sender.id)
      const domain = await req.app.locals.apex.store.db.collection('servers').findOne({
        hostname: url.hostname
      })
      if (domain?.blocked) {
        console.log(`Ignoring post from ${url}:`, req.body)
        return res.sendStatus(200)
      }
    } catch (err) {
      console.error('Error checking domain blocks:', err)
    }
    next()
  }
)

// define routes using prepacakged middleware collections
app.route(routes.inbox)
  .post(actorOnDemand, apex.net.inbox.post)
  .get(actorOnDemand, apex.net.inbox.get)
app.route(routes.outbox)
  .get(actorOnDemand, apex.net.outbox.get)
  .post(apex.net.outbox.post)

// replace apex's target actor validator with our create on demand method
app.get(routes.actor, actorOnDemand, apex.net.actor.get)
app.get(routes.followers, actorOnDemand, apex.net.followers.get)
app.get(routes.following, actorOnDemand, apex.net.following.get)
app.get(routes.liked, actorOnDemand, apex.net.liked.get)
app.get(routes.object, apex.net.object.get)
app.get(routes.activity, apex.net.activityStream.get)
app.get(routes.shares, apex.net.shares.get)
app.get(routes.likes, apex.net.likes.get)
app.get(
  '/.well-known/webfinger',
  apex.net.wellKnown.parseWebfinger,
  actorOnDemand,
  apex.net.validators.targetActor,
  apex.net.wellKnown.respondWebfinger
)
app.get('/.well-known/nodeinfo', apex.net.nodeInfoLocation.get)
app.get('/nodeinfo/:version', apex.net.nodeInfo.get)

app.on('apex-inbox', async ({ actor, activity, recipient, object }) => {
  switch (activity.type.toLowerCase()) {
    // automatically reshare incoming posts
    case 'create': {
      const to = [
        recipient.followers[0],
        apex.consts.publicAddress
      ]
      const share = await apex.buildActivity('Announce', recipient.id, to, {
        object: activity.object[0].id,
        // make sure sender can see it even if they don't follow yet
        cc: actor.id
      })
      apex.addToOutbox(recipient, share)
      break
    }
    // automatically accept follow requests
    case 'follow': {
      const accept = await apex.buildActivity('Accept', recipient.id, actor.id, {
        object: activity.id
      })
      const { postTask: publishUpdatedFollowers } = await apex.acceptFollow(recipient, activity)
      await apex.addToOutbox(recipient, accept)
      return publishUpdatedFollowers()
    }
  }
})

/// Guppe web setup
// html/static routes
app.use(history({
  index: '/web/index.html',
  rewrites: [
    // do not redirect webfinger et c.
    { from: /^\/\.well-known\//, to: context => context.request.originalUrl }
  ]
}))
app.use('/f', express.static('public/files'))
app.use('/web', express.static('web/dist'))
// web json routes
app.get('/groups', (req, res, next) => {
  apex.store.db.collection('streams')
    .aggregate([
      { $sort: { _id: -1 } }, // start from most recent
      { $limit: 10000 }, // don't traverse the entire history
      { $match: { type: 'Announce' } },
      { $group: { _id: '$actor', postCount: { $sum: 1 } } },
      { $lookup: { from: 'objects', localField: '_id', foreignField: 'id', as: 'actor' } },
      // merge joined actor up
      { $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ['$actor', 0] }, '$$ROOT'] } } },
      { $project: { _id: 0, _meta: 0, actor: 0 } }
    ])
    .sort({ postCount: -1 })
    .limit(Number.parseInt(req.query.n) || 50)
    .toArray()
    .then(groups => apex.toJSONLD({
      id: `https://${DOMAIN}/groups`,
      type: 'OrderedCollection',
      totalItems: groups.length,
      orderedItems: groups
    }))
    // .then(groups => { console.log(JSON.stringify(groups)); return groups })
    .then(groups => res.json(groups))
    .catch(err => {
      console.log(err.message)
      return res.status(500).send()
    })
})
app.get('/stats', async (req, res, next) => {
  try {
    const queueSize = await apex.store.db.collection('deliveryQueue')
      .countDocuments({ attempt: 0 })
    const uptime = process.uptime()
    res.json({ queueSize, uptime })
  } catch (err) {
    next(err)
  }
})

app.use(function (err, req, res, next) {
  console.error(err.message, req.body, err.stack)
  if (!res.headersSent) {
    res.status(500).send('An error occurred while processing the request')
  }
})

client.connect()
  .then(async () => {
    const { default: AutoEncrypt } = await import('@small-tech/auto-encrypt')
    apex.store.db = client.db(DB_NAME)
    await apex.store.setup()
    await apex.store.db.collection('servers').createIndex({
      hostname: 1
    }, {
      name: 'servers-primary',
      unique: true
    })
    apex.systemUser = await apex.store.getObject(apex.utils.usernameToIRI('system_service'), true)
    if (!apex.systemUser) {
      const systemUser = await createGuppeActor('system_service', `${DOMAIN} system service`, `${DOMAIN} system service`, icon, 'Service')
      await apex.store.saveObject(systemUser)
      apex.systemUser = systemUser
    }
    let server
    if (process.env.NODE_ENV === 'production') {
      if (PROXY_MODE) {
        server = http.createServer(app)
        try {
          // boolean or number
          app.set('trust proxy', JSON.parse(PROXY_MODE))
        } catch (ignore) {
          // string
          app.set('trust proxy', PROXY_MODE)
        }
      } else {
        server = AutoEncrypt.https.createServer({ domains: [DOMAIN] }, app)
      }
    } else {
      server = https.createServer(sslOptions, app)
    }
    server.listen(PORT_HTTPS, function () {
      console.log('Guppe server listening on port ' + PORT_HTTPS)
    })
    onShutdown(async () => {
      await new Promise((resolve, reject) => {
        server.close(err => (err ? reject(err) : resolve()))
      })
      await client.close()
      console.log('Guppe server closed')
    })
  })
