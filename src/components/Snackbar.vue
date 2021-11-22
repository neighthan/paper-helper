<template>
  <v-snackbar v-model="showSnackbar" :color="color" :timeout="timeoutMs">
    {{msg}}
    <template v-if="btnName" v-slot:action="{attrs}">
      <v-btn text v-bind="attrs" @click="callback">{{btnName}}</v-btn>
    </template>
  </v-snackbar>
</template>

<script lang="ts">
import {Component, Vue} from "vue-property-decorator"

export type Snackable = {
  snackbar: Snackbar
}

@Component
export default class Snackbar extends Vue {
  protected showSnackbar = false
  protected msg = ""
  protected color = "gray"
  protected timeoutMs = 5000
  protected btnName = ""
  protected callback = () => {}

  // WARNING: if you call show() a second time before the first set of messsages have
  // finished, you could get bugs (e.g. the wrong callback button)
  show(msg: string | string[], {color, timeoutMs, btnName, callback} : {color?: string, timeoutMs?: number, btnName?: string, callback?: () => void}={}) {
    this.color = color? color : "gray"
    this.timeoutMs = timeoutMs? timeoutMs : 5000
    if (btnName !== undefined && callback !== undefined) {
      this.btnName = btnName
      this.callback = () => {
        this.showSnackbar = false
        callback()
      }
    } else {
      this.btnName = ""
      this.callback = () => {}
    }
    const msgs = typeof msg === "string"? [msg] : msg
    this.msg = msgs[0]
    this.showSnackbar = true
    for (let i = 1; i < msgs.length; i++) {
      setTimeout(() => {
        this.msg = msgs[i]
        this.showSnackbar = true
      }, i * this.timeoutMs)
    }
  }
}
</script>
