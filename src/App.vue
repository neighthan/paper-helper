<template>
  <div id="app">
    <v-app>
      <NavDrawer/>
      <router-view />
      <v-footer app>
      </v-footer>
    </v-app>
  </div>
</template>

<script lang="ts">
import {Component, Vue} from "vue-property-decorator"
import NavDrawer from "@/components/NavDrawer.vue"

@Component({components: {NavDrawer}})
export default class App extends Vue {
  mounted() {
    const vue = this
    function kbShortcuts(e: KeyboardEvent) {
      if (e.ctrlKey && e.key == "h") {
        vue.$router.push("/")
        e.preventDefault() // open chrome history
      } else if (e.ctrlKey && e.key == "b") {
        vue.$root.$emit("toggleNav")
      }
    }
    document.addEventListener("keydown", kbShortcuts)
  }
}
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
