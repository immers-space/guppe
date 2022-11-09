require('dotenv').config()
const MongoClient = require('mongodb').MongoClient
const { onShutdown } = require('node-graceful-shutdown')
const ActivitypubExpress = require('activitypub-express')

const { DOMAIN, DB_URL, DB_NAME } = process.env

const client = new MongoClient(DB_URL)

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
  domain: DOMAIN,
  actorParam: 'actor',
  objectParam: 'id',
  itemsPerPage: 100,
  requestTimeout: 500,
  routes
})

client.connect()
  .then(async () => {
    apex.store.db = client.db(DB_NAME)
    let resumeDeliveryTimer
    function deliver () {
      Promise.resolve(apex.startDelivery())
        .catch(err => {
          console.error('Error starting delivery', err)
        })
        .finally(() => {
          // delivery will stop if the queue empties, ensure it keeps running when new work is available
          // no effect if called while already running
          resumeDeliveryTimer = setTimeout(deliver, 5000)
        })
    }
    deliver()
    onShutdown(async () => {
      clearTimeout(resumeDeliveryTimer)
      apex.offlineMode = true
      // time for last delivery to finish (need to fix in apex)
      await new Promise(resolve => setTimeout(resolve, 3000))
      await client.close()
      console.log('Guppe delivery worker closed')
    })
  })
  .catch(err => {
    console.error('Error starting delivery worker', err)
    process.exit(1)
  })
