<template>
  <div id="notes">
    <v-app-bar app height="48">
      <NavIcon/>
      <v-spacer></v-spacer>
      {{entry.title}}
      <v-spacer></v-spacer>
      <v-progress-circular v-if="saving" indeterminate></v-progress-circular>
      <v-btn v-else icon @click.native.stop="saveEntry">
        <v-icon>save</v-icon>
      </v-btn>
      <v-btn icon @click="encryptAbstract"><v-icon>lock</v-icon></v-btn>
    </v-app-bar>
    <v-main>
      <v-container fluid>
        <MdText
          :entry="entry"
          :password="password"
          @saveStart="saving = true"
          @saveEnd="saving = false"
          ref="mdText"
        />
      </v-container>
    </v-main>
  </div>
</template>

<script lang="ts">
import {Component, Vue} from "vue-property-decorator"
import NavIcon from "@/components/NavIcon.vue"
import Markdown from "@/components/Markdown.vue"
import MdText from "@/components/MdText.vue"
import { Entry } from "@/entries/entry"
import { decrypt, stringToCipherBuffer } from "@/crypto"
import { joinPath, readEntryFile } from "@/backend/files"

@Component({components: {NavIcon, Markdown, MdText}})
export default class Notes extends Vue {
  entryId = this.$route.params["id"]
  entryClass = this.$route.params["class"]
  entry = new Entry() // filler until you get the real entry
  saving = false
  password: string | null = null

  async created() {
    const entry = await readEntryFile(this.entryClass, this.entryId)
    console.log("in notes", entry)
    if (entry === undefined) {
      console.log(
        `Couldn't find entry with id ${this.entryId} and class ${this.entryClass}!`
      )
      return
    }

    if (entry.iv !== undefined) {
      this.password = prompt("Enter the password to decrypt this entry.")
      if (this.password === null) return
      const decoded = await decrypt(stringToCipherBuffer(entry.content), entry.iv, this.password)
      if (decoded !== null) {
        entry.content = decoded
      } else {
        // couldn't decode, so password was wrong. Set to null so MdText can't save
        // any changes.
        this.password = null
      }
    }
    this.entry = entry
  }

  async encryptAbstract() {
    if (this.entry.iv !== undefined) {
      alert("This entry is already encrypted.")
      return
    }
    // don't encrypt the notes here; we keep it unencrypted for easy editing and
    // encrypt on save in MdText, so we just need to give MdText the password and
    // set entry.iv so it knows the entry should be encrypted
    let password: string | null = null
    let repeatPassword: string | null = ""
    while (password !== repeatPassword) {
      password = prompt("Please enter a password to encrypt this entry.")
      if (password === null) return
      repeatPassword = prompt("Please repeat the password.")
      if (repeatPassword === null) return
    }
    this.password = password
    this.entry.iv = crypto.getRandomValues(new Uint8Array(12))
  }

  saveEntry() {
    (<MdText> this.$refs.mdText).saveEntry(false)
  }
}
</script>
