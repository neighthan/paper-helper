<template>
  <div class="home">
      <v-app-bar app>
        <template v-if="focusSearch">
          <v-col>
            <v-text-field autofocus v-model="query" append-icon="search" hide-details></v-text-field>
          </v-col>
          <v-col>
            <v-text-field label="Tags" v-model="query_tags" append-icon="search" hide-details></v-text-field>
          </v-col>
          <v-btn icon @click="focusSearch = false">
            <v-icon>reply</v-icon>
          </v-btn>
        </template>
        <template v-else>
          <NavIcon/>
          <v-col cols="3" v-if="$vuetify.breakpoint.smAndUp">
            <v-text-field autofocus v-model="query" append-icon="search" hide-details
              @keydown.enter="openFirst"
            ></v-text-field>
          </v-col>

          <v-col cols="3" v-if="$vuetify.breakpoint.smAndUp">
            <v-text-field label="Tags" v-model="query_tags" append-icon="search" hide-details
              @keydown.enter="openFirst"
            ></v-text-field>
          </v-col>

          <v-spacer></v-spacer>
            <v-tooltip open-delay="1000">
              <template v-slot:activator="{on}">
                <span v-on="on">{{queryName}}</span>
              </template>
              <span>{{queryTooltip}}</span>
            </v-tooltip>
          <v-spacer></v-spacer>

          <v-btn icon @click="focusSearch = true" v-if="$vuetify.breakpoint.xsOnly">
            <v-icon>search</v-icon>
          </v-btn>

          <v-btn icon @click="showEntryDialog(makeDefaultEntry())">
            <v-icon>add</v-icon>
          </v-btn>
          <component
            :is="entryComponent"
            ref="entryDialog"
            :all_tags="meta.tags"
            @addEntry="addEntry"
          ></component>

          <v-dialog v-model="addFromURLDialog">
            <template v-slot:activator="{on, attrs}">
              <v-btn icon v-bind="attrs" v-on="on">
                <v-icon>add_circle_outline</v-icon>
              </v-btn>
            </template>
            <v-card>
              <v-card-text>
                <v-text-field v-model="addURL" label="URL" autofocus @keypress.enter="addFromURL"></v-text-field>
              </v-card-text>
            </v-card>
          </v-dialog>

          <v-tooltip open-delay="1000">
            <template v-slot:activator="{on}">
              <v-btn icon v-on="on" @click="syncDropbox">
                <v-icon>backup</v-icon>
              </v-btn>
            </template>
            <span>Sync to Dropbox</span>
          </v-tooltip>

          <v-tooltip open-delay="1000">
            <template v-slot:activator="{on}">
              <v-btn icon v-on="on" @click="download_data">
                <v-icon>save_alt</v-icon>
              </v-btn>
            </template>
            <span>Download</span>
          </v-tooltip>

          <v-tooltip open-delay="1000">
            <template v-slot:activator="{on}">
              <v-btn icon v-on="on" @click="load_file">
                <v-icon>arrow_upward</v-icon>
              </v-btn>
            </template>
            <span>Upload</span>
          </v-tooltip>
        </template>
      </v-app-bar>

      <v-main>
        <v-container fluid>
          <v-expansion-panels accordion>
            <v-expansion-panel v-for="e of filteredEntries" :key="e.id">
              <ExpansionItem
                :entry="e"
                @editEntry="showEntryDialog"
                @deleteEntry="deleteEntry"
                @updatePriority="updatePriority"
                @addNotes="addNotes"
              />
            </v-expansion-panel>
          </v-expansion-panels>
          <v-snackbar v-model="show_undelete_snackbar">
            Data deleted.
            <v-btn text color="red" @click="undeleteEntry">Undo</v-btn>
          </v-snackbar>
        </v-container>
      </v-main>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import PaperDialog from "@/entries/papers/PaperDialog.vue"
import ToDoDialog from "@/entries/todos/ToDoDialog.vue"
import ExpansionItem from "@/components/ExpansionItem.vue"
import NavIcon from "@/components/NavIcon.vue"
import {importInto} from "dexie-export-import"
import {DB, PapersDb, Meta, getMeta, exportDB} from "../db"
import {syncDropbox as syncDropbox_} from "../dbx"
import {getPaperFromArxiv, getDataFromYouTube} from "../utils"
import {updateTodos, deleteTodos, ToDo} from "@/entries/todos/todos"
import {EntryTypes} from "@/entries/entries"
import {Snackable} from "@/components/Snackbar.vue"

type ValueOf<T> = T[keyof T]

@Component({components: {PaperDialog, ToDoDialog, ExpansionItem, NavIcon}})
export default class Home<E extends ValueOf<typeof EntryTypes>> extends Vue {
  done_loading = false
  cachedEntries: {[key: string]: E["class"]} = {}
  query = ""
  query_tags = ""
  deletedEntry: E["class"] | null = null
  show_undelete_snackbar = false
  dialog = false
  addFromURLDialog = false
  addURL = ""
  meta: Meta = new Meta()
  queryId =  this.$route.params["queryId"]
  savedQueryTags: string[] = []
  queryName = ""
  queryTooltip = ""
  focusSearch = false
  entryKey!: E["key"]
  entryTable!: E["table"]
  EntryClass!: E["ctor"]
  entryComponent: E["component"] = "PaperDialog"

  async created() {
    this.entryKey = <any> (await DB.savedQueries.get(this.queryId))!.entryType
    if (EntryTypes[this.entryKey] === undefined) {
      console.error(`No entry type with key ${this.entryKey}!`)
      return
    }
    // use an object / map instead of if-else once things are working
    this.entryTable = EntryTypes[this.entryKey].table
    this.EntryClass = EntryTypes[this.entryKey].ctor
    this.entryComponent = EntryTypes[this.entryKey].component

    await loadFromDB(this, DB, this.queryId)
  }
  deleteEntry(entry: E["class"]) {
    this.deletedEntry = entry
    this.show_undelete_snackbar = true
    this.entryTable.delete(this.deletedEntry.id)
    deleteTodos(entry)
    if (entry.lastSyncTime !== undefined) {
      DB.deletedEntries.add({id: entry.id, lastSyncTime: entry.lastSyncTime})
    }
    Vue.delete(this.cachedEntries, entry.id)
    if (entry instanceof ToDo) {
      entry.removeFromEntry()
    }
  }
  undeleteEntry() {
    this.show_undelete_snackbar = false
    if (this.deletedEntry !== null) {
      this.entryTable.add(<any> this.deletedEntry)
      updateTodos(this.deletedEntry)
      DB.deletedEntries.delete(this.deletedEntry.id)
      Vue.set(this.cachedEntries, this.deletedEntry.id, this.deletedEntry)
      if (this.deletedEntry instanceof ToDo) {
        this.deletedEntry.restoreToEntry()
      }
    }
  }
  addNotes(entry: E["class"]) {
    this.$router.push({path: `/notes/${entry.table}/${entry.id}`})
  }
  openFirst() {
    if (this.filteredEntries.length > 0) {
      this.addNotes(Object.values(this.filteredEntries)[0])
    }
  }
  @Watch("addFromURLDialog")
  onPropertyChanged(newVal: boolean, oldVal: boolean) {
    if (!newVal) {
      this.addURL = ""
    }
  }
  async addFromURL() {
    const url = this.addURL
    this.addFromURLDialog = false
    let data: E["class"]
    if (url.includes("arxiv.org")) {
      data = await getPaperFromArxiv(url)
    } else if (url.includes("youtube.com")) {
      data = await getDataFromYouTube(url)
    } else {
      // in Python, I would try to find an h1 for the url if not on arxiv. We could try to
      // fetch(url) and do that here, but with CORS, we probably won't have access
      data = new this.EntryClass()
      // todo: a nicer way to discriminate Entry subtypes that might have this additional
      // field? we could use this later for entry.date too
      if ((<any> data).url !== undefined) {
        (<any> data).url = url
      }
    }
    data.tags.push(...this.savedQueryTags)
    if (this.query_tags !== "") {
      data.tags.push(...this.query_tags.split(" "))
    }
    this.showEntryDialog(data)
  }
  async syncDropbox() {
    const msgs = await syncDropbox_([this.entryTable])
    ;(this.$root as unknown as Snackable).snackbar.show(
      msgs, {timeoutMs: 3000, btnName: "Fix Merge Conflicts", callback: this.goToMergeConflicts}
    )
  }
  async download_data() {
    try {
      const jsonBlob = await exportDB(DB)
      const date = new Date().toLocaleDateString().replace(/\//g, "_")
      const mime_type = "text/json"
      const a = document.createElement("a")
      a.download = `paper_data_backup__${date}.json`
      a.href = window.URL.createObjectURL(jsonBlob)
      a.dataset.downloadurl = [mime_type, a.download, a.href].join(":")
      a.click()

    } catch (error) {
      console.error(error)
    }
  }
  load_file() {
    const vue = this
    const file_picker = document.createElement("input")
    file_picker.type = "file"
    file_picker.accept = "application/json"
    file_picker.addEventListener("change", function(event) {
      if (event === null) return
      const input = event.target as HTMLInputElement
      if (input.files !== null && input.files.length > 0) {
        vue.load_data(input.files[0])
      }
    })
    file_picker.click()
  }
  async load_data(jsonFile: File) {
    await importInto(DB, jsonFile, {overwriteValues: true})
    await loadFromDB(this, DB, this.queryId)
  }
  async addEntry(entry: E["class"]) {
    Vue.set(this.cachedEntries, entry.id, entry)
  }
  updatePriority(entry: E["class"], priority: number) {
    entry.priority = priority
    // thought TS would be smart enough for this, but apparently it can't tell that
    // E["class"] and E["table"] are always compatible
    this.entryTable.put(<any> entry)
    updateTodos(entry) // so the todos' priorities will match the entry's
    if (entry instanceof ToDo) {
      entry.updateInEntry()
    }
  }

  async goToMergeConflicts() {
    let query = await DB.savedQueries.get("mergeConflicts")
    if (query === undefined) {
      query = {
        id: "mergeConflicts",
        name: "Merge Conflicts",
        searchString: "",
        tags: ["merge-conflict"],
        timeAdded: Date.now(),
        lastSyncTime: -1,
        lastModifiedTime: +new Date(),
        entryType: "paper",
      }
      await DB.savedQueries.put(query)
    }
    this.$router.push({path: `/search/${query.id}`})
  }
  showEntryDialog(entry: E["class"]) {
    // todo: ensure all dialogs have .show?
    ;(<any> this.$refs.entryDialog).show(entry)
  }
  makeDefaultEntry(): E["class"] {
    const entry = new this.EntryClass()
    entry.tags = [...this.savedQueryTags]
    if (this.query_tags !== "") {
      entry.tags.push(...this.query_tags.split(" "))
    }
    return entry
  }
  get filteredEntries() {
    let data = Object.values(this.cachedEntries)
    if (this.query_tags != "") {
      const query_tags = this.query_tags.toLowerCase().split(" ")
      data = data.filter(e => query_tags.every(tag => e.searchTags.has(tag)))
    }
    if (this.query != "") {
      const query = this.query.toLowerCase()
      data = data.filter(e => e.searchString.includes(query))
    }
    return data.sort((e1, e2) => e2.priority - e1.priority)
  }
}


async function loadFromDB<E extends ValueOf<typeof EntryTypes>>(
  vue: Home<E>, db: PapersDb, queryId: string
) {
  vue.done_loading = false
  vue.meta = await getMeta(db)
  const query = await db.savedQueries.get(queryId)
  if (!query) {
    console.error(`Unable to find query with id ${queryId}!`)
    return
  }
  vue.queryName = query.name
  vue.savedQueryTags = query.tags
  vue.queryTooltip = `Tags: ${query.tags}\nSearch: ${query.searchString}`

  const queryTags = query.tags.map(tag => tag.toLowerCase())
  const queryStr = query.searchString.toLowerCase()
  // typescript can't do filter on types that are unions of array types, but it works on
  // arrays of union types, so hack around this a bit.
  let entries = <E["class"][]> await vue.entryTable.toArray()
  entries = entries.filter(entry => {
    const tags = entry.tags.map(tag => tag.toLowerCase())
    for (let tag of queryTags) {
      if (!tags.includes(tag)) {
        return false
      }
    }
    if (entry.title.toLowerCase().includes(queryStr) || entry.notes.toLowerCase().includes(queryStr)) {
      return true
    }
    return false
  }) as typeof entries
  vue.cachedEntries = Object.fromEntries(entries.map(e => [e.id, e]))
  vue.done_loading = true
}
</script>

<style scoped lang="scss">
.v-tooltip__content {
  font-size: 14px;
  padding: 3px 5px;
}
</style>
