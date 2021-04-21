<template>
  <div id="settings">
    <v-app-bar app>
      <NavIcon/>
    </v-app-bar>
    <v-main>
      <span>Settings here!</span>
    </v-main>
  </div>
</template>

<script lang="ts">
import {Component, Vue} from "vue-property-decorator"
import NavIcon from "@/components/NavIcon.vue"

@Component({components: {NavIcon}})
export default class Settings extends Vue {
}
</script>

<style scoped lang="scss">
</style>
