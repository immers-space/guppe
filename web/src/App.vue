<template>
  <div id="app">
    <div class="w3-bar w3-black w3-card">
      <div class="w3-section flex">
        <router-link to="/"><i class="fas fa-home" title="home"></i></router-link>
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
      <a href="https://github.com/wmurphyrd/guppe"><i class="fab fa-github w3-hover-opacity"></i></a>
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
</style>
