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
            <v-card-title>Settings</v-card-title>
            <v-card-text>
              <v-select
                label="Log Level"
                v-model="logLevel"
                :items="logLevels"
                @input="updateLogLevel"
              ></v-select>
              <v-checkbox
                label="Sync with Dropbox"
                v-model="syncDropbox"
                @change="updateDbxSync"
              ></v-checkbox>
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

          <v-card>
            <v-card-title>App Info</v-card-title>
            <v-card-text>Version: 1.0.0</v-card-text>
          </v-card>

          <v-card v-if="devMode">
            <v-card-title>Dev Things</v-card-title>
            <v-card-actions>
              <v-btn text @click="addEntries">Add Entries</v-btn>
            </v-card-actions>
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
import {DB, getMeta, Meta} from "../db"
import { Entry } from "@/entries/entry"
import { PaperData } from "@/entries/papers/paper"
import getAllSavedPosts from "@/reddit"
import RedditInfoDialog from "@/components/RedditInfoDialog.vue"
import SimpleDialog from "@/components/SimpleDialog.vue"
import {LogLevel, logLevels as _logLevels} from "@/logger"
import {updateTodos} from "@/entries/todos/todos"

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
  devMode = (<any> window).webpackHotUpdate !== undefined
  syncDropbox = false
  meta: Meta | null = null

  async created() {
    this.meta = await getMeta(DB)
    this.logLevel = this.meta.logLevel
    this.syncDropbox = this.meta.syncDropbox
  }

  /**
   * It's fine to rename to an existing tag; this just merges the tags.
   */
  async renameTags() {
    const meta = this.meta!
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

    let nModified = 0
    for (const table of DB.tables) {
      const first = await table.toCollection().first()
      if (first.tags === undefined) return
      const entries = <Entry[]> await table.toArray()
      const modifiedEntries: Entry[] = []
      for (let entry of entries) {
        if (entry.tags.includes(this.oldTag)) {
          if (entry.tags.includes(this.newTag) || !this.newTag) {
            entry.tags.splice(entry.tags.indexOf(this.oldTag), 1)
          } else {
            entry.tags[entry.tags.indexOf(this.oldTag)] = this.newTag
          }
          modifiedEntries.push(entry)
          nModified++
        }
      }
      table.bulkPut(modifiedEntries)
      for (const entry of modifiedEntries) {
        updateTodos(entry) // so the todos' tags will still match the entry's
      }
    }

    this.snackbarMsg = `Renamed ${this.oldTag} -> ${this.newTag} in ${nModified} papers.`
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
  updateLogLevel() {
    this.meta!.logLevel = this.logLevel
  }
  updateDbxSync() {
    this.meta!.syncDropbox = this.syncDropbox
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
  addEntries() {
    for (let i = 0; i < 300; i ++) {
      const paper = new PaperData()
      paper.title = "Mastering Atari, Go, Chess and Shogi by Planning with a Learned Model"
      paper.notes = "Constructing agents with planning capabilities has long been one of the main challenges in the pursuit of artificial intelligence. Tree-based planning methods have enjoyed huge success in challenging domains, such as chess and Go, where a perfect simulator is available. However, in real-world problems the dynamics governing the environment are often complex and unknown. In this work we present the MuZero algorithm which, by combining a tree-based search with a learned model, achieves superhuman performance in a range of challenging and visually complex domains, without any knowledge of their underlying dynamics. MuZero learns a model that, when applied iteratively, predicts the quantities most directly relevant to planning: the reward, the action-selection policy, and the value function. When evaluated on 57 different Atari games - the canonical video game environment for testing AI techniques, in which model-based planning approaches have historically struggled - our new algorithm achieved a new state of the art. When evaluated on Go, chess and shogi, without any knowledge of the game rules, MuZero matched the superhuman performance of the AlphaZero algorithm that was supplied with the game rules."
      paper.tags = ["ml", "rl", "paper", "games", "planning", "world-model"]
      paper.priority = 0
      paper.url = "https://arxiv.org/abs/1911.08265"
      paper.authors = ["Julian Schrittwieser", "Ioannis Antonoglou", "Thomas Hubert", "Karen Simonyan", "Laurent Sifre", "Simon Schmitt", "Arthur Guez", "Edward Lockhart", "Demis Hassabis", "Thore Graepel", "Timothy Lillicrap", "David Silver"]
      paper.date = "2020/02/21"
      DB.papers.put(paper)
    }
  }
}
</script>
