<template>
  <div id="app">
    <v-app>
      <NavDrawer/>
      <PaperDialog ref="paperDialog"/>
      <router-view />
    </v-app>
  </div>
</template>

<script lang="ts">
import {Component, Vue} from "vue-property-decorator"
import NavDrawer from "@/components/NavDrawer.vue"
import {DB, getMeta} from "@/db"
import {logger} from "@/logger"
import PaperDialog from "@/entries/papers/PaperDialog.vue"
import {PaperData} from "@/entries/papers/paper"
import {syncAllDropbox} from "@/dbx"

@Component({components: {NavDrawer, PaperDialog}})
export default class App extends Vue {
  async created() {
    const logLevel = (await getMeta(DB)).logLevel
    logger.logLevel = logLevel
    console.log(`Logging at level ${logLevel}.`)
  }

  openPaperDialog(paper: PaperData) {
    ;(<PaperDialog> this.$refs.paperDialog).show(paper)
  }

  mounted() {
    const vue = this
    function kbShortcuts(e: KeyboardEvent) {
      if (e.ctrlKey && e.key == "h") {
        if (vue.$router.currentRoute.path !== "/") {
          vue.$router.push("/")
        }
        e.preventDefault() // open chrome history
      } else if (e.ctrlKey && e.key == "b") {
        vue.$root.$emit("toggleNav")
      } else if (e.ctrlKey && e.altKey && e.key == "n") {
        vue.openPaperDialog(new PaperData())
      }
    }
    document.addEventListener("keydown", kbShortcuts)

    syncAllDropbox().then(() => {
      console.log("Dropbox synced.")
    })
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
