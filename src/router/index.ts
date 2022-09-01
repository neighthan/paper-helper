import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";
import Search from "../views/Search.vue";
import Settings from "../views/Settings.vue"
import Notes from "../views/Notes.vue"
import Home from "../views/Home.vue"

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/settings",
    name: "Settings",
    component: Settings,
  },
  {
    path: "/notes/:class/:id",
    name: "Notes",
    component: Notes,
  },
  {
    path: "/search/:queryId",
    name: "Search",
    component: Search,
  },
];

const router = new VueRouter({
  routes,
});

export {router, routes}
