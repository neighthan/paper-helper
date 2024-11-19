import Vue from "vue"
import App from "./App.vue"
import "./registerServiceWorker"
import {router} from "./router"
import vuetify from "./plugins/vuetify"
import { setupDirs } from "./backend/files"

import { listAllFiles } from "./debug"
import git from "isomorphic-git"
import {FS, CFS} from "@/backend/files"
import {gitPush, gitPull, gitClone, gitSetup, gitFinalizeMerge} from "@/backend/git"
import http from 'isomorphic-git/http/web/index.js'

window.onload = () => {
  const devMode = (<any> window).webpackHotUpdate !== undefined
  if (devMode) {
    ;(window as any).listAllFiles = listAllFiles
    ;(window as any).git = git
    ;(window as any).FS = FS
    ;(window as any).CFS = CFS
    ;(window as any).gitClone = gitClone
    ;(window as any).gitPull = gitPull
    ;(window as any).gitPush = gitPush
    ;(window as any).gitFinalizeMerge = gitFinalizeMerge
    ;(window as any).http = http
  }
}

import "material-design-icons-iconfont/dist/material-design-icons.css"
Vue.config.productionTip = false;

async function setup() {
  if (localStorage.getItem("setupDone") === "true") {
    return
  }
  await gitSetup()
  await setupDirs()
  localStorage.setItem("merging", "false")
  localStorage.setItem("setupDone", "true")
}

setup().then(_ => {
  new Vue({
    router,
    vuetify,
    render: (h) => h(App),
  }).$mount("#app");
})
