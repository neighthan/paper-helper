<template>
  <v-app-bar-nav-icon @click.stop="toggleNav"></v-app-bar-nav-icon>
</template>

<script lang="ts">
import {Component, Vue} from "vue-property-decorator"

@Component
export default class NavIcon extends Vue {
  toggleNav() {
    this.$root.$emit("toggleNav")
  }
}
</script>
