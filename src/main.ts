import Vue from "vue";
import App from "./App.vue";
import "./registerServiceWorker";
import {router} from "./router";
import vuetify from "./plugins/vuetify";
import { setupDirs } from "./backend/files"


import "material-design-icons-iconfont/dist/material-design-icons.css"
Vue.config.productionTip = false;

setupDirs().then(_ => {
  new Vue({
    router,
    vuetify,
    render: (h) => h(App),
  }).$mount("#app");
})
