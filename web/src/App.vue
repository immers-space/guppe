<template>
  <div id="app">
    <div class="w3-bar w3-black w3-card">
      <div class="w3-section flex">
        <nav id="main-nav">
          <router-link to="/"><i class="fas fa-home" title="home"></i></router-link>
          <a href="https://github.com/immers-space/guppe/wiki/Guppe-Groups-FAQ"><i class="fas fa-question-circle" title="FAQ"></i>FAQ</a>
          <a href="https://opencollective.com/guppe-groups"><i class="fas fa-dollar-sign" title="support"></i>Support</a>
        </nav>
        <div v-if="stats" class="flex">
          <div>Uptime: {{ uptime }}</div>
          <div>Backlog: {{ queueSize }}</div>
        </div>
      </div>
    </div>
    <div class="w3-row">
      <div class="w3-col s0 m1 l2">&nbsp;</div>
      <div class="w3-col s12 m10 l8 w3-content">
        <router-view/>
      </div>
      <div class="w3-col s0 m1 l2">&nbsp;</div>
    </div>
    <footer class="w3-container w3-padding-64 w3-center w3-opacity w3-light-grey w3-xlarge">
      <a href="https://github.com/wmurphyrd/guppe"><i class="fab fa-github w3-hover-opacity w3-margin"></i></a>
      <a rel="me" href="https://social.coop/@datatitian"><i class="fab fa-mastodon w3-hover-opacity w3-margin"></i></a>
    </footer>
  </div>
</template>

<script>
export default {
  data () {
    return {
      stats: undefined
    }
  },
  mounted () {
    window.fetch('/stats', { headers: { Accept: 'application/json' } })
      .then(res => res.json())
      .then(data => (this.stats = data))
      .catch(err => console.warn('Error fetching stats', err))
  },
  computed: {
    uptime () {
      if (!this.stats) {
        return
      }
      const fmtd = (this.stats.uptime / 3600)
        .toLocaleString(undefined, { maximumFractionDigits: 1, minimumFractionDigits: 1 })
      return `${fmtd} hours`
    },
    queueSize () {
      if (!this.stats) {
        return
      }
      return `${this.stats.queueSize.toLocaleString()} posts`
    }
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}
.flex {
  display: flex;
  justify-content: space-between;
}
.flex > * {
  padding-left: 16px;
  padding-right: 16px;
}
#main-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
#main-nav a i {
 padding-right: 3px;
}
</style>
