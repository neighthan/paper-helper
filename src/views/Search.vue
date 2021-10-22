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

          <v-btn icon @click="openDialog">
            <v-icon>add</v-icon>
          </v-btn>
          <v-dialog v-model="dialog" persistent :fullscreen="$vuetify.breakpoint.xsOnly">
            <PaperDialog :initialData="editingPaper" :all_tags="meta.tags" @addPaper="add_paper"/>
          </v-dialog>

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
              <v-btn icon v-on="on" @click="sync_dropbox">
                <v-icon>backup</v-icon>
              </v-btn>
            </template>
            <span>Sync to Dropbox</span>
          </v-tooltip>

          <v-tooltip open-delay="1000">
            <template v-slot:activator="{on}">
              <v-btn icon v-on="on" @click="download_data">
                <v-icon :color="download_red">save_alt</v-icon>
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
            <v-expansion-panel v-for="pd of filtered_paper_data" :key="pd.id">
              <ExpansionItem :pd="pd"
                @edit_pd="edit_pd" @delete_pd="delete_pd" @updatePriority="updatePriority"
                @addNotes="addNotes"
              />
            </v-expansion-panel>
          </v-expansion-panels>
          <v-snackbar v-model="show_undelete_snackbar">
            Data deleted.
            <v-btn text color="red" @click="undelete_pd">Undo</v-btn>
          </v-snackbar>
          <v-snackbar v-model="showDbxSnackbar">
            {{dbxSnackbarMsg}}
            <v-btn text @click="goToMergeConflicts">Fix Merge Conflicts</v-btn>
          </v-snackbar>
        </v-container>
      </v-main>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import PaperDialog from "@/components/PaperDialog.vue"
import ExpansionItem from "@/components/ExpansionItem.vue"
import NavIcon from "@/components/NavIcon.vue"
import {exportDB, importInto} from "dexie-export-import"
import { CachedPaperData, PaperData, PaperTempData } from "@/paper_types"
import { Dropbox } from 'dropbox'
import {DB, PapersDb, Meta, getMeta, SavedQuery} from "../db"
import {genId, getPaperFromArxiv, getDataFromYouTube} from "../utils"

const DROPBOX_PATH = "/paper-helper-db.json"

@Component({components: {PaperDialog, ExpansionItem, NavIcon}})
export default class Home extends Vue {
  done_loading = false
  cached_paper_data: CachedPaperData = {}
  paper_temp_data: PaperTempData = {}
  query = ""
  query_tags = ""
  deleted_pd: PaperData | null = null
  show_undelete_snackbar = false
  n_papers_all_red = 10
  dialog = false
  addFromURLDialog = false
  addURL = ""
  editingPaper: PaperData = new PaperData()
  meta: Meta = new Meta()
  queryId =  this.$route.params["queryId"]
  savedQueryTags: string[] = []
  queryName = ""
  queryTooltip = ""
  focusSearch = false
  showDbxSnackbar = false
  dbxSnackbarMsg = ""

  created() {
    loadFromDB(this, DB, this.queryId)
    this.editingPaper = this.makeDefaultPaper()
  }
  delete_pd(paper: PaperData) {
    this.deleted_pd = paper
    this.show_undelete_snackbar = true
    DB.papers.delete(this.deleted_pd.id)
    DB.deletedEntries.add({id: paper.id, lastSyncTime: paper.lastSyncTime})
    Vue.delete(this.cached_paper_data, paper.id)
  }
  undelete_pd() {
    this.show_undelete_snackbar = false
    if (this.deleted_pd !== null) {
      DB.papers.add(this.deleted_pd)
      DB.deletedEntries.delete(this.deleted_pd.id)
      Vue.set(this.cached_paper_data, this.deleted_pd.id, this.deleted_pd)
    }
  }
  edit_pd(paper: PaperData) {
    this.editingPaper = paper
    this.dialog = true
  }
  addNotes(paper: PaperData) {
    this.$router.push({path: `/notes/${paper.id}`})
  }
  openFirst() {
    this.addNotes(this.filtered_paper_data[0])
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
    let data: PaperData
    if (url.includes("arxiv.org")) {
      data = await getPaperFromArxiv(url)
    } else if (url.includes("youtube.com")) {
      data = await getDataFromYouTube(url)
    } else {
      // in Python, I would try to find an h1 for the url if not on arxiv. We could try to
      // fetch(url) and do that here, but with CORS, we probably won't have access
      data = new PaperData()
      data.url = url
    }
    data.tags.push(...this.savedQueryTags)
    if (this.query_tags !== "") {
      data.tags.push(...this.query_tags.split(" "))
    }
    this.editingPaper = data
    this.dialog = true
  }
  async download_data() {
    try {
      const jsonBlob = await exportDB(DB, {prettyJson: true})
      const date = new Date().toLocaleDateString().replace(/\//g, "_")
      const mime_type = "text/json"
      const a = document.createElement("a")
      a.download = `paper_data_backup__${date}.json`
      a.href = window.URL.createObjectURL(jsonBlob)
      a.dataset.downloadurl = [mime_type, a.download, a.href].join(":")
      a.click()

      // TODO: this line should only run if you actually download the file
      // (not if you cancel saving it)
      this.meta.n_papers_since_backup = 0
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
    this.meta.n_papers_since_backup = this.n_papers_all_red
  }
  async add_paper(save: boolean, paper: PaperData) {
    paper.lastModifiedTime = Date.now()
    this.dialog = false
    if(save) {
      if (!paper.id) {
        paper.time_added = Date.now()
        paper.id = genId()
      }
      await DB.papers.put(paper)
      Vue.set(this.cached_paper_data, paper.id, paper)
      this.paper_temp_data[paper.id] = {
        search_string: `${paper.title.toLowerCase()} ${paper.abstract.toLowerCase()}`,
        search_tags: getPrefixSet(paper.tags),
        date_string: new Date(paper.date || paper.time_added).toLocaleString("default", {month: "short", year: "numeric"}),
      }
      this.meta.tags = [...new Set(this.meta.tags.concat(paper.tags))]
      this.meta.n_papers_since_backup += 1
    }
  }
  updatePriority(paper: PaperData, priority: number) {
    paper.priority = priority
    DB.papers.put(paper)
  }
  async sync_dropbox() {
    if (!this.meta.dropboxToken) {
      // TODO: make this nicer
      let token =  prompt("Enter your dropbox token")
      if (!token) {
        return
      }
      this.meta.dropboxToken = token
    }
    const dbx = new Dropbox({accessToken: this.meta.dropboxToken})

    try {
      let response = await dbx.filesDownload({path: DROPBOX_PATH})
      let dbxJsonBlob = (<Blob> (<any> response.result).fileBlob)
      const json = JSON.parse(await dbxJsonBlob.text())
      const tables = json.data.data
      const deletedEntries: Map<string, number> = new Map()
      for (let deletedEntry of await DB.deletedEntries.toArray()) {
        deletedEntries.set(deletedEntry.id, deletedEntry.lastSyncTime)
      }
      const dbxPapers: Map<string, PaperData> = new Map()
      for (let table of tables) {
        if (table.tableName !== "papers") continue
        for (let paper of <PaperData[]> table.rows) {
          dbxPapers.set(paper.id, paper)
        }
      }

      const localPapers: Map<string, PaperData> = new Map()
      const localIdsModified: string[] = []
      const localIdsNotModified: string[] = []
      const papers = await DB.papers.toArray()
      for (let paper of papers) {
        localPapers.set(paper.id, paper)
        // if a paper has never been synced to dbx, lastSyncTime is -1, so
        // lastModifiedTime will be greater
        if (paper.lastModifiedTime > paper.lastSyncTime) {
          localIdsModified.push(paper.id)
        } else {
          localIdsNotModified.push(paper.id)
        }
      }
      // these papers were synced to dbx but are missing from it now, so they must have
      // been deleted by another device. Since they haven't been modified locally,
      // just sync the deletion.
      const localOnlyIdsNotModified = localIdsNotModified.filter(id => !dbxPapers.has(id))

      const mergeIds: string[] = []
      const addPapers: PaperData[] = []
      const mergedPapers: PaperData[] = []
      for (let [id, dbxPaper] of dbxPapers) {
        if (localPapers.has(id)) {
          const localPaper = localPapers.get(id)!
          if (localPaper.lastSyncTime == localPaper.lastModifiedTime) {
            // local hasn't been modified, so keep dbx version, if different
            if (dbxPaper.lastSyncTime > localPaper.lastSyncTime) {
              mergedPapers.push(dbxPaper)
            }
          } else if (dbxPaper.lastSyncTime == localPaper.lastSyncTime) {
            // dbx hasn't been modified, so keep local (by doing nothing)
          } else {
            // local and dbx have both been modified
            mergeIds.push(dbxPaper.id)
          }
        } else { // dbx only; add to local if not deleted (and not modified since)
          if (deletedEntries.has(id)) {
            const lastSyncTime = deletedEntries.get(id)
            if (lastSyncTime === undefined || dbxPaper.lastModifiedTime > lastSyncTime) {
              addPapers.push(dbxPaper)
            }
          } else {
            addPapers.push(dbxPaper)
          }
        }
      }

      for (let id of mergeIds) {
        const dbxPaper = dbxPapers.get(id)
        const localPaper = localPapers.get(id)
        if (dbxPaper === undefined || localPaper === undefined) continue
        let newerPaper: PaperData
        let olderPaper: PaperData
        if (dbxPaper.lastModifiedTime > localPaper.lastModifiedTime) {
          newerPaper = dbxPaper
          olderPaper = localPaper
        } else {
          newerPaper = localPaper
          olderPaper = dbxPaper
        }
        const newPaperLines = new Set(newerPaper.abstract.split("\n"))
        const addLines = []
        for (let line of olderPaper.abstract.split("\n")) {
          if (line && !newPaperLines.has(line)) {
            addLines.push(line)
          }
        }

        if (addLines.length) {
          newerPaper.tags.push("merge-conflict")
          newerPaper.abstract += `\n\n---\n# Merge conflict lines\n${addLines.join("\n")}`
        }

        newerPaper.lastModifiedTime = Date.now()
        mergedPapers.push(newerPaper)
      }

      await Promise.all([
        DB.papers.bulkDelete(localOnlyIdsNotModified),
        DB.papers.bulkAdd(addPapers),
        DB.papers.bulkPut(mergedPapers),
        DB.deletedEntries.clear(),
      ])

      const nDeleted = localOnlyIdsNotModified.length
      const nAdded = addPapers.length
      const nMerged = mergedPapers.length
      this.dbxSnackbarMsg = `# Added: ${nAdded}; # Deleted: ${nDeleted}; # Merged: ${nMerged}`
      this.showDbxSnackbar = true

      this._dbUpload()
    } catch (error) {
      console.error("No file found.")
      console.error(error)
      this._dbUpload()
    }
  }
  async _dbUpload() {
    const syncTime = Date.now()
    await DB.papers.toCollection().modify(paper => {
      paper.lastSyncTime = syncTime
    })
    const jsonBlob = await exportDB(DB, {prettyJson: true})
    const jsonStr = await jsonBlob.text()
    const dbx = new Dropbox({accessToken: this.meta.dropboxToken})
    dbx.filesUpload({
      path: DROPBOX_PATH,
      contents: new File([jsonStr], "db.json", {type: "application/json"}),
      mode: {".tag": "overwrite"},
    }).then((response) => {
      console.log("Finished uploading.")
      console.log(response)
    }).catch((error) => {
      console.error("Error uploading!")
      console.error(error)
    })
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
      }
      await DB.savedQueries.put(query)
    }
    this.$router.push({path: `/search/${query.id}`})
  }
  openDialog() {
    this.editingPaper = this.makeDefaultPaper()
    this.dialog = true
  }
  makeDefaultPaper() {
    const paper = new PaperData()
    paper.tags = [...this.savedQueryTags]
    if (this.query_tags !== "") {
      paper.tags.push(...this.query_tags.split(" "))
    }
    return paper
  }
  get filtered_paper_data() {
    let data = Object.values(this.cached_paper_data)
    if (this.query_tags != "") {
      const query_tags = this.query_tags.toLowerCase().split(" ")
      data = data.filter(pd => query_tags.every(tag => this.paper_temp_data[pd.id].search_tags.has(tag)))
    }
    if (this.query != "") {
      const query = this.query.toLowerCase()
      data = data.filter(pd => this.paper_temp_data[pd.id].search_string.includes(query))
    }
    return data.sort((pd1, pd2) => pd2.priority - pd1.priority)
  }
  get download_red() {
    const red = Math.round(255 * Math.min(this.meta.n_papers_since_backup / this.n_papers_all_red, 1))
    return `rgba(${red}, 0, 0, 1)`
  }
}


function getPrefixSet(tags: string[]) {
  const prefixes = new Set([""])
  for (let tag of tags.map(tag => tag.toLowerCase())) {
    for (let i = 1; i <= tag.length; i++) {
      prefixes.add(tag.slice(0, i))
    }
  }
  return prefixes
}

async function loadFromDB(vue: Home, db: PapersDb, queryId: string) {
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
  const papers = (await db.papers.toArray()).filter(paper => {
    const tags = paper.tags.map(tag => tag.toLowerCase())
    for (let tag of queryTags) {
      if (!tags.includes(tag)) {
        return false
      }
    }
    if (paper.title.toLowerCase().includes(queryStr) || paper.abstract.toLowerCase().includes(queryStr)) {
      return true
    }
    return false
  })
  papers.forEach(p => {
    vue.paper_temp_data[p.id] = {
      search_string: `${p.title.toLowerCase()} ${p.abstract.toLowerCase()}`,
      search_tags: getPrefixSet(p.tags),
      date_string: new Date(p.date || p.time_added).toLocaleString("default", {month: "short", year: "numeric"}),
    }
  })
  vue.cached_paper_data = Object.fromEntries(papers.map(p => [p.id, p]))
  vue.done_loading = true
}
</script>

<style scoped lang="scss">
.v-tooltip__content {
  font-size: 14px;
  padding: 3px 5px;
}
</style>
