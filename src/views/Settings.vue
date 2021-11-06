<template>
  <div id="settings">
    <v-app-bar app>
      <NavIcon/>
      Settings
    </v-app-bar>
    <v-main>
      <v-container fluid>
        <v-col>
          <v-card>
            <v-card-title>Rename Tag</v-card-title>
            <v-card-text>
              <v-row>
                <v-text-field label="Old Tag" v-model="oldTag"></v-text-field>
                <v-text-field label="New Tag" v-model="newTag"></v-text-field>
              </v-row>
            </v-card-text>
            <v-card-actions>
              <v-btn text @click.native.stop="renameTags">Replace</v-btn>
            </v-card-actions>
          </v-card>

          <v-card>
            <v-card-title>Log Level</v-card-title>
            <v-card-text>
              <v-select
                label="Log Level"
                v-model="logLevel"
                :items="logLevels"
                @input="updateLogLevel"
              ></v-select>
            </v-card-text>
          </v-card>

          <v-card>
            <v-card-title>Add Saved Reddit Posts</v-card-title>
            <v-card-actions>
              <v-dialog v-model="getPasswordDialog">
                <template v-slot:activator="{on, attrs}">
                  <v-btn text v-bind="attrs" v-on="on">
                    Add
                  </v-btn>
                </template>
                <v-card>
                  <v-card-text>
                    <v-text-field v-model="password" label="Password" autofocus @keypress.enter="addFromReddit"></v-text-field>
                  </v-card-text>
                </v-card>
              </v-dialog>
              <v-dialog v-model="redditInfoDialog">
                <template v-slot:activator="{on, attrs}">
                  <v-btn text v-bind="attrs" v-on="on">Update Reddit Info</v-btn>
                </template>
                <RedditInfoDialog @close="redditInfoDialog = false"/>
              </v-dialog>
            </v-card-actions>
          </v-card>

          <v-card>
            <SimpleDialog
              title="Delete Database"
              iconName="mdi-database-remove"
              :fieldNames="['Type DELETE to confirm.']"
              :confirmBtnText="'Confirm'"
              @save="deleteDb"
            />
          </v-card>

          <v-card>
            <v-card-title>Keyboard Shortcuts</v-card-title>
            <v-card-text>
              <kbd>ctrl+h</kbd> go to home<br>
              <kbd>ctrl+b</kbd> toggle navigation drawer
            </v-card-text>
          </v-card>

        </v-col>
        <v-snackbar v-model="showSnackbar" :color="snackbarColor">
          {{snackbarMsg}}
        </v-snackbar>
      </v-container>
    </v-main>
  </div>
</template>

<script lang="ts">
import {Component, Vue} from "vue-property-decorator"
import NavIcon from "@/components/NavIcon.vue"
import {DB, getMeta} from "../db"
import { PaperData } from "@/paper_types"
import getAllSavedPosts from "@/reddit"
import RedditInfoDialog from "@/components/RedditInfoDialog.vue"
import SimpleDialog from "@/components/SimpleDialog.vue"
import {LogLevel, logLevels as _logLevels} from "@/logger"

const logLevels = Object.keys(_logLevels)

@Component({components: {NavIcon, RedditInfoDialog, SimpleDialog}})
export default class Settings extends Vue {
  oldTag = ""
  newTag = ""
  showSnackbar = false
  snackbarMsg = ""
  redditInfoDialog = false
  getPasswordDialog = false
  password = ""
  snackbarColor = "black"
  logLevel: LogLevel = "silent"
  logLevels = logLevels

  async created() {
    const meta = await getMeta(DB)
    this.logLevel = meta.logLevel
  }

  /**
   * It's fine to rename to an existing tag; this just merges the tags.
   */
  async renameTags() {
    let metas = await DB.meta.toArray()
    if (!metas.length) {
      this.snackbarMsg = "No tags found!"
      this.snackbarColor = "red"
      this.showSnackbar = true
      return
    }
    if (metas.length > 1) {
      console.log("Warning: found multiple meta entries! Only using the first.")
      console.log(metas)
    }
    const meta = metas[0]
    const idx = meta.tags.indexOf(this.oldTag)
    if (idx == -1) {
      this.snackbarMsg = `Tag ${this.oldTag} not found!`
      this.snackbarColor = "red"
      this.showSnackbar = true
      return
    }
    meta.tags.splice(idx, 1)
    if (this.newTag && !meta.tags.includes(this.newTag)) {
      meta.tags.push(this.newTag)
    }
    meta._updateDb()
    const papers = await DB.papers.toArray()
    const modifiedPapers: PaperData[] = []
    for (let paper of papers) {
      if (paper.tags.includes(this.oldTag)) {
        if (paper.tags.includes(this.newTag) || !this.newTag) {
          paper.tags.splice(paper.tags.indexOf(this.oldTag), 1)
        } else {
          paper.tags[paper.tags.indexOf(this.oldTag)] = this.newTag
        }
        modifiedPapers.push(paper)
      }
    }
    DB.papers.bulkPut(modifiedPapers)
    this.snackbarMsg = `Renamed ${this.oldTag} -> ${this.newTag} in ${modifiedPapers.length} papers.`
    this.oldTag = ""
    this.newTag = ""
    this.snackbarColor = "black"
    this.showSnackbar = true
  }
  async deleteDb(confirmation: {[key: string]: string}) {
    const confirmStr = Object.values(confirmation)[0]
    if (confirmStr === "DELETE") {
      console.log("Deleting database.")
      await DB.delete()
      // if you don't reload, you can't access DB anymore.
      window.location.reload()
    } else {
      console.log(`Deletion not confirmed; got ${confirmStr}.`)
    }
  }
  async updateLogLevel() {
    const meta = await getMeta(DB)
    meta.logLevel = this.logLevel
  }
  addFromReddit() {
    this.getPasswordDialog = false
    getAllSavedPosts(this.password).then(msg => {
      this.snackbarMsg = msg
      this.snackbarColor =  msg.toLowerCase().includes("error") ? "red" : "black"
      this.showSnackbar = true
    })
    this.password = ""
  }
}
</script>

<style scoped lang="scss">
</style>
