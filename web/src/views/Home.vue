<template>
  <div class="w3-container">
    <div class="w3-center">
      <img alt="Guppe logo" src="/f/guppe.png">
    </div>
    <h1 class="w3-center">Guppe Groups</h1>
    <p>
      Guppe brings social groups to the fediverse &mdash; making it easy to connect and meet new
      people based on shared
      interests without the maniuplation of your attention to maximize ad revenue nor the
      walled garden lock-in of capitalist social media.
    </p>
    <p>
      Guppe is brought to you by <a href="https://web.immers.space">Immers Space</a>,
      the Immersive Web freelancer cooperative that uses its margins to fund the development of free software that breaks down the walls between metaverse platforms.
    </p>
    <h2 class="w3-center">How does Guppe work?</h2>
    <p>
      Guppe groups look like regular users you can interact with using your existing account on any
      ActivityPub service, but they automatically share anything you send them with all of their followers.
    </p>
    <ol>
      <li>Follow a group on @{{ domain }} to join that group</li>
      <li>Mention a group on @{{ domain }} to share a post with everyone in the group</li>
      <li>New groups are created on demand, just search for or mention @YourGroupNameHere@{{ domain }} and it will show up</li>
      <li>Visit a @{{ domain }} group profile to see the group history</li>
    </ol>

    <h2 class="w3-center">Support Guppe</h2>
    <p>
      <a href="https://opencollective.com/guppe-groups">Become a member of Guppe on Open Collective</a> to
      help keep Guppe running, vote on development decicisions, and see your name listed here.
    </p>
    <div class="flex-center">
      <object type="image/svg+xml" data="https://opencollective.com/guppe-groups/tiers/member.svg?avatarHeight=48&width=350"></object>
    </div>

    <h2 class="w3-center">Active Groups</h2>
    <p class="w3-center">Top 50 groups with the most recent posts</p>
    <div class="profile-grid w3-margin-bottom w3-mobile">
      <div v-for="group of groups" class="w3-card w3-container w3-section" :key="group._id">
        <profile-summary :actor="group" class="profile"/>
        <router-link :to="`/u/${group.preferredUsername}`">Group profile...</router-link>
      </div>
    </div>

  </div>
</template>

<script>
import ProfileSummary from '@/components/ProfileSummary.vue'

export default {
  name: 'home',
  components: {
    ProfileSummary
  },
  data () {
    return {
      groups: [],
      error: null,
      domain: window.location.host
    }
  },
  created () {
    window.fetch(`/groups`, {
      method: 'get',
      headers: {
        accept: 'application/json'
      }
    }).then(res => res.json())
      .then(json => {
        this.groups = json.orderedItems
      })
      .catch(err => (this.error = err.message))
  }
}
</script>

<style scoped>
  .profile {
    width: 300px;
  }
  .profile-grid {
    display: flex;
    flex-flow: row wrap;
    justify-content: space-between;
    align-content: space-between;
  }
</style>

<style>
  .profile-image {
    width: 75px;
  }
  .flex-center {
    display: flex;
    justify-content: center;
  }
</style>
