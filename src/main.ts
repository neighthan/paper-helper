import Vue from "vue"
import App from "./App.vue"
import "./registerServiceWorker"
import {router} from "./router"
import vuetify from "./plugins/vuetify"
import { setupDirs } from "./backend/files"

import { listAllFiles } from "./debug"
import git from "isomorphic-git"
import {FS, CFS} from "@/backend/files"

window.onload = () => {
  const devMode = (<any> window).webpackHotUpdate !== undefined
  if (devMode) {
    ;(window as any).listAllFiles = listAllFiles
    ;(window as any).git = git
    ;(window as any).FS = FS
    ;(window as any).CFS = CFS
  }
}

import "material-design-icons-iconfont/dist/material-design-icons.css"
Vue.config.productionTip = false;

setupDirs().then(_ => {
  new Vue({
    router,
    vuetify,
    render: (h) => h(App),
  }).$mount("#app");
})
