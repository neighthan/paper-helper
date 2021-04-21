<template>
  <div class="home">
      <v-app-bar app>
        <NavIcon/>
        <v-col cols="12" sm="6" md="3">
          <v-text-field v-model="query" append-icon="search" hide-details></v-text-field>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-text-field label="Tags" v-model="query_tags" append-icon="search" hide-details></v-text-field>
        </v-col>

        <v-spacer></v-spacer>
        <v-dialog v-model="dialog">
          <template v-slot:activator="{on, attrs}">
            <v-btn icon v-bind="attrs" v-on="on">
              <v-icon>add</v-icon>
            </v-btn>
          </template>
          <PaperDialog :initialData="editingPaper" :all_tags="meta.tags" @addPaper="add_paper"/>
        </v-dialog>

        <v-tooltip open-delay="1000">
          <template v-slot:activator="{on}">
            <v-btn icon v-on="on" @click="sync_dropbox">
              <v-icon>refresh</v-icon>
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
      </v-app-bar>

      <v-main>
        <v-container fluid>
          <v-expansion-panels accordion>
            <v-expansion-panel v-for="(pd, idx) of filtered_paper_data" :key="pd.id">
              <ExpansionItem :pd="pd" :idx="idx" @edit_pd="edit_pd" @delete_pd="delete_pd"/>
            </v-expansion-panel>
          </v-expansion-panels>
          <v-snackbar v-model="show_undelete_snackbar">
            Data deleted.
            <v-btn text color="red" @click="undelete_pd">Undo</v-btn>
          </v-snackbar>
        </v-container>
      </v-main>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import PaperDialog from "@/components/PaperDialog.vue"
import ExpansionItem from "@/components/ExpansionItem.vue"
import NavIcon from "@/components/NavIcon.vue"
import Dexie from "dexie"
import {exportDB, importInto} from "dexie-export-import"
import { PaperData, PaperTempData } from "@/paper_types"
import { Dropbox } from 'dropbox'


@Component({components: {PaperDialog, ExpansionItem, NavIcon}})
export default class Home extends Vue {
  done_loading = false
  paper_data: PaperData[] = []
  paper_temp_data: PaperTempData = {}
  query = ""
  query_tags = ""
  min_priority = -100
  max_priority = 100
  deleted_pd: PaperData | null = null
  deleted_pd_idx = -1
  show_undelete_snackbar = false
  n_papers_all_red = 10
  updating = false
  dialog = false
  editingPaper: PaperData | null = null
  meta: Meta = new Meta(0, 0, 0, [], "")

  created() {
    loadFromDB(this, DB)
  }
  delete_pd(idx: number) {
    this.deleted_pd = this.paper_data.splice(idx, 1)[0]
    this.deleted_pd_idx = idx
    this.show_undelete_snackbar = true
    DB.papers.delete(this.deleted_pd.id)
  }
  undelete_pd() {
    this.show_undelete_snackbar = false
    if (this.deleted_pd !== null) {
      this.paper_data.splice(this.deleted_pd_idx, 0, this.deleted_pd)
      DB.papers.add(this.deleted_pd)
    }
  }
  edit_pd(idx: number) {
    this.editingPaper = this.paper_data[idx]
    this.updating = true
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
      this.meta!.n_papers_since_backup = 0
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
    importInto(DB, jsonFile, {overwriteValues: true})
    loadFromDB(this, DB)
    this.meta!.n_papers_since_backup = this.n_papers_all_red
  }
  add_paper(save: boolean, paper: PaperData) {
    this.dialog = false
    this.editingPaper = null
    if(save) {
      if (!this.updating) {
        paper["time_added"] = Date.now()
        paper["id"] = this.meta!.next_paper_id
        this.meta!.next_paper_id += 1
      }
      DB.papers.put(paper)
      this.paper_temp_data[paper.id] = {
        show_slider: false,
        search_string: `${paper.title.toLowerCase()} ${paper.abstract.toLowerCase()}`,
        search_tags: getPrefixSet(paper.tags),
        date_string: new Date(paper.date || paper.time_added).toLocaleString("default", {month: "short", year: "numeric"}),
      }
      DB.papers.toArray().then((papers) => {
        this.paper_data = papers.sort((pd1, pd2) => pd2.priority - pd1.priority)
      })

      this.meta!.tags = [...new Set(this.meta!.tags.concat(paper.tags))]
      this.meta!.n_papers_since_backup += 1
    }
    this.updating = false
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

    const jsonBlob = await exportDB(DB, {prettyJson: true})
    const jsonStr = await jsonBlob.text()
    dbx.filesUpload({
      path: "/paper-helper-db.json",
      contents: new File([jsonStr], "db.json", {type: "application/json"}),
      mode: {".tag": "overwrite"},
    }).then((response) => {
      console.log(response)
    }).catch((error) => {
      console.error(error)
    })
  }
  // computed
  get filtered_paper_data() {
    let data = this.paper_data // direct reference; don't mutate!
    if (this.query_tags != "") {
      const query_tags = this.query_tags.toLowerCase().split(" ")
      data = data.filter(pd => query_tags.every(tag => this.paper_temp_data[pd.id].search_tags.has(tag)))
    }
    if (this.query != "") {
      const query = this.query.toLowerCase()
      data = data.filter(pd => this.paper_temp_data[pd.id].search_string.includes(query))
    }
    return data
  }
  get download_red() {
    const red = Math.round(255 * Math.min(this.meta!.n_papers_since_backup / this.n_papers_all_red, 1))
    return `rgba(${red}, 0, 0, 1)`
  }
}

// TODO: pull db things into a separate .ts file then just do `import db from "db.ts"`
class Meta {
    id: number
    _n_papers_since_backup: number
    _next_paper_id: number
    _tags: string[]
    _dropboxToken: string
    constructor(
      id: number,
      n_papers_since_backup: number,
      next_paper_id: number,
      tags: string[],
      dropboxToken: string,
    ) {
      this.id = id
      this._n_papers_since_backup = n_papers_since_backup
      this._next_paper_id = next_paper_id
      this._tags = tags
      this._dropboxToken = dropboxToken
    }

    // dexie didn't like using a getter for id, but we don't want a setter anyway, so
    // it's not a problem (just can't make it readonly)
    get n_papers_since_backup() {
      return this._n_papers_since_backup
    }
    get next_paper_id() {
      return this._next_paper_id
    }
    get tags() {
      return this._tags
    }
    get dropboxToken() {
      return this._dropboxToken
    }
    set n_papers_since_backup(n_papers_since_backup) {
      this._n_papers_since_backup = n_papers_since_backup
      this._updateDb()
    }
    set next_paper_id(next_paper_id) {
      this._next_paper_id = next_paper_id
      this._updateDb()
    }
    set tags(tags) {
      this._tags = tags
      this._updateDb()
    }
    set dropboxToken(dropboxToken) {
      this._dropboxToken = dropboxToken
      this._updateDb()
    }
    _updateDb() {
      // DB.meta.update(this._id, {n_papers_since_backup: this._n_papers_since_backup, next_paper_id: this._next_paper_id, tags: this._tags})
      DB.meta.update(this.id, this)
    }
}

class PapersDb extends Dexie {
    papers: Dexie.Table<PaperData, number>
    meta: Dexie.Table<Meta, number>

    constructor (dbName: string) {
        super(dbName)
        this.version(1).stores({
          // only declare properties you want to index (use in .where())
          papers: "id, title, abstract, tags",
          meta: "id", // n_papers_since_backup, next_paper_id, tags
        })
        this.papers = this.table('papers')
        this.meta = this.table('meta')
        this.meta.mapToClass(Meta)
    }
}

const DB = new PapersDb("paper-helper")

function getPrefixSet(tags: string[]) {
  const prefixes = new Set([""])
  for (let tag of tags.map(tag => tag.toLowerCase())) {
    for (let i = 1; i <= tag.length; i++) {
      prefixes.add(tag.slice(0, i))
    }
  }
  return prefixes
}

function loadFromDB(vue: Home, db: PapersDb) {
  vue.done_loading = false
  db.meta.toArray().then((meta) => {
    if (!meta.length) {
      vue.meta = new Meta(0, 0, 0, [], "")
      db.meta.add(vue.meta)
    } else {
      if (meta.length > 1) {
        console.log("Warning: found multiple meta entries.")
        console.log(meta)
      }
      vue.meta = meta[0]
    }
  })
  db.papers.toArray().then((papers) => {
    papers.forEach(p => {
      vue.paper_temp_data[p.id] = {
        show_slider: false,
        search_string: `${p.title.toLowerCase()} ${p.abstract.toLowerCase()}`,
        search_tags: getPrefixSet(p.tags),
        date_string: new Date(p.date || p.time_added).toLocaleString("default", {month: "short", year: "numeric"}),
      }
    })
    vue.paper_data = papers.sort((pd1, pd2) => pd2.priority - pd1.priority)
    vue.done_loading = true // assumes meta is already done loading
  })
}
</script>

<style scoped lang="scss">
.v-tooltip__content {
  font-size: 14px;
  padding: 3px 5px;
}
</style>
