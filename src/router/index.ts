import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";
import Search from "../views/Search.vue";
import Settings from "../views/Settings.vue"
import Notes from "../views/Notes.vue"

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: "/",
    name: "Home",
    component: Search,
  },
  {
    path: "/settings",
    name: "Settings",
    component: Settings,
  },
  {
    path: "/notes/:paperId",
    name: "Notes",
    component: Notes,
  },
];

const router = new VueRouter({
  routes,
});

export {router, routes}
