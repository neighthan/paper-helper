<template>
  <div id="notes">
    <v-app-bar app height="48">
      <NavIcon/>
      <v-spacer></v-spacer>
      {{paper.title}}
      <v-spacer></v-spacer>
      <v-progress-circular v-if="saving" indeterminate></v-progress-circular>
      <v-btn v-else icon @click.native.stop="savePaper">
        <v-icon>save</v-icon>
      </v-btn>
      <v-btn icon @click="encryptAbstract"><v-icon>lock</v-icon></v-btn>
    </v-app-bar>
    <v-main>
      <v-container fluid>
        <MdText :paper="paper" :password="password" @saveStart="saving = true" @saveEnd="saving = false"/>
      </v-container>
    </v-main>
  </div>
</template>

<script lang="ts">
import {Component, Vue} from "vue-property-decorator"
import NavIcon from "@/components/NavIcon.vue"
import Markdown from "@/components/Markdown.vue"
import MdText from "@/components/MdText.vue"
import {DB} from "../db"
import { PaperData } from "@/paper_types"
import { decrypt, stringToCipherBuffer } from "@/crypto"

@Component({components: {NavIcon, Markdown, MdText}})
export default class Notes extends Vue {
  paperId = this.$route.params["paperId"]
  paper = new PaperData() // filler until you get the real paper
  saving = false
  password: string | null = null

  async created() {
    const paper = await DB.papers.get(this.paperId)
    if (paper === undefined) {
      console.log(`Couldn't find paper with id ${this.paperId}!`)
      return
    }

    if (paper.iv !== undefined) {
      this.password = prompt("Enter the password to decrypt this entry.")
      if (this.password === null) return
      const decoded = await decrypt(stringToCipherBuffer(paper.abstract), paper.iv, this.password)
      if (decoded !== null) {
        paper.abstract = decoded
      } else {
        // couldn't decode, so password was wrong. Set to null so MdText can't save
        // any changes.
        this.password = null
      }
    }
    this.paper = paper
  }

  async encryptAbstract() {
    // don't encrypt the abstract here; we keep it unencrypted for easy editing and
    // encrypt on save in MdText, so we just need to give MdText the password and
    // set paper.iv so it knows the paper should be encrypted
    let password: string | null = null
    let repeatPassword: string | null = ""
    while (password !== repeatPassword) {
      password = prompt("Please enter a password to encrypt this entry.")
      if (password === null) return
      repeatPassword = prompt("Please repeat the password.")
      if (repeatPassword === null) return
    }
    this.password = password
    this.paper.iv = crypto.getRandomValues(new Uint8Array(12))
  }
}
</script>
