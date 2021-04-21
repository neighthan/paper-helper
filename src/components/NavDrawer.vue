<template>
  <v-navigation-drawer app v-model="showNav">
    <v-list nav dense flat>
      <v-list-item v-for="route in routes" :key="route.name" :to="route.path">
        <v-list-item-title>{{route.name}}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script lang="ts">
import {Component, Vue} from "vue-property-decorator"
import {routes} from "../router/index"

@Component
export default class NavDrawer extends Vue {
  showNav = false
  routes = routes
  toggleNav() {
    this.showNav = !this.showNav
  }
  mounted() {
    this.$root.$on("toggleNav", this.toggleNav)
  }
}
</script>
