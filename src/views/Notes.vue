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
        <v-slider
          :max="commits.length"
          v-model="commitIdx"
          @change="commitSliderUpdated"
        ></v-slider>

        <MdText
          :entry="entry"
          :password="password"
          @saveStart="saving = true"
          @saveEnd="saving = false"
          @committed="loadCommits"
          ref="mdText"
        />
      </v-container>
    </v-main>
  </div>
</template>

<script lang="ts">
import {Component, Vue} from "vue-property-decorator"
import NavIcon from "@/components/NavIcon.vue"
import MdText from "@/components/MdText.vue"
import { Entry } from "@/entries/entry"
import { decrypt, stringToCipherBuffer } from "@/crypto"
import { getEntryPath, readEntryFile } from "@/backend/files"
import { getCommitHistory, readFileAtCommit, SimpleCommit } from "@/backend/git"
import { parseHeader } from "@/backend/files"

@Component({components: {NavIcon, MdText}})
export default class Notes extends Vue {
  entryId = this.$route.params["id"]
  entryClass = this.$route.params["class"]
  entry = new Entry() // filler until you get the real entry
  saving = false
  password: string | null = null
  commits: SimpleCommit[] = []
  commitIdx: number = 0

  async created() {
    const entry = await readEntryFile(this.entryClass, this.entryId)
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
    this.loadCommits()
  }

  async loadCommits() {
    const fpath = getEntryPath(this.entry)
    // we want commits from oldest to newest
    this.commits = (await getCommitHistory(fpath)).reverse()
    this.commitIdx = this.commits.length
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

  get mdText() {
    return <MdText> this.$refs.mdText
  }

  saveEntry() {
    this.mdText.saveEntry(false)
  }

  async commitSliderUpdated() {
    if (this.commitIdx == this.commits.length) {
      this.mdText.showPrevCommitText = false
    } else {
      const fpath = getEntryPath(this.entry)
      const commit = this.commits[this.commitIdx]
      // console.log(new Date(commit.timestamp))
      // TODO: cache the text (or the Entry) to commit.contents and use that next
      // time?
      const md = await readFileAtCommit(fpath, commit.oid)
      const {content} = parseHeader(md)
      this.mdText.prevCommitText = content
      this.mdText.showPrevCommitText = true
    }
  }
}
</script>
