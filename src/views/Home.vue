<template>
  <div class="home">
      <v-app-bar app>
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
          <v-card>
            <v-card-text>
              <v-text-field label="Title" v-model="title" dense autofocus></v-text-field>
              <v-combobox label="Tags" v-model="tags" :items="all_tags" multiple :delimiters="[' ']" dense small-chips>
              </v-combobox>
              <v-row>
                <v-col>
                  <v-text-field label="Priority" v-model="priority" dense></v-text-field>
                </v-col>
                <v-col>
                  <v-text-field label="Date (YYYY/MM/DD)" v-model="date" dense></v-text-field>
                </v-col>
              </v-row>
              <v-textarea label="Abstract" v-model="abstract" rows=11 no-resize dense></v-textarea>
              <v-text-field label="Authors" v-model="authors" dense></v-text-field>
              <v-text-field label="URL" v-model="url" dense></v-text-field>
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions>
              <v-btn color="primary" text @click="add_paper(true)">
                Save
              </v-btn>
              <v-btn color="error" text @click="add_paper(false)">
                Cancel
              </v-btn>
              <v-spacer></v-spacer>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <v-btn icon @click="download_data">
          <v-icon :color="download_red">save_alt</v-icon>
        </v-btn>
        <v-btn icon @click="load_file">
          <v-icon>arrow_upward</v-icon>
        </v-btn>
      </v-app-bar>

      <v-main>
        <v-container fluid>
          <v-expansion-panels accordion>
            <v-expansion-panel v-for="(pd, idx) of filtered_paper_data" :key="pd.id">
              <v-expansion-panel-header hide-actions>
                <v-card class="mx-auto" flat>
                  <v-card-title>{{pd.title}}</v-card-title>
                  <v-card-actions>
                    <v-tooltip right>
                      <template v-slot:activator="{on}">
                        <v-btn text v-on="on" @click.native.stop="open_link(pd.url)">
                          Open
                        </v-btn>
                      </template>
                      <span>{{pd.url}}</span>
                    </v-tooltip>

                    <v-tooltip top v-if="!paper_temp_data[pd.id].show_slider">
                      <template v-slot:activator="{on}">
                        <v-btn icon v-on="on" @mousedown.native.stop="activate_slider(pd, idx)">
                          <v-icon>swap_vert</v-icon>
                        </v-btn>
                      </template>
                      <span>{{pd.priority}}</span>
                    </v-tooltip>
                    <v-col v-else cols="8" sm="4" md="2">
                      <v-slider v-model="pd.priority" :min="min_priority" :max="max_priority" thumb-label="always"
                        thumb-size="24" hide-details height="5" :ref="'slider' + pd.id"></v-slider>
                    </v-col>

                    <v-btn icon @click.native.stop="delete_pd(idx)">
                      <v-icon>delete</v-icon>
                    </v-btn>

                    <v-btn icon @click.native.stop="edit_pd(idx)">
                      <v-icon>edit</v-icon>
                    </v-btn>

                    <v-chip v-for="tag of pd.tags" :key="pd.id + tag" label outlined>{{tag}}</v-chip>

                    <v-spacer></v-spacer>
                    {{pd.date_string}}
                  </v-card-actions>
                </v-card>
              </v-expansion-panel-header>
              <v-expansion-panel-content>
                <span class="abstract">
                  {{pd.abstract}}
                </span>
              </v-expansion-panel-content>
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
import HelloWorld from "@/components/HelloWorld.vue"; // @ is an alias to /src
import Dexie from "dexie"
import {exportDB, importInto} from "dexie-export-import"


type PaperData = {
  id: number,
  title: string,
  abstract: string,
  tags: string[],
  date: string,
  time_added: number,
  priority: number,
  url: string,
  authors: string[],
}
type PaperTempDatum = {
  show_slider: boolean,
  search_string: string,
  search_tags: Set<string>,
  date_string: string,
}
type PaperTempData = {
  [key: number]: PaperTempDatum
}

@Component
export default class Home extends Vue {
  done_loading = false
  paper_data: PaperData[] = []
  paper_temp_data: PaperTempData = {}
  all_tags: string[] = []
  query = ""
  query_tags = ""
  min_priority = -100
  max_priority = 100
  deleted_pd: PaperData | null = null
  deleted_pd_idx = -1
  show_undelete_snackbar = false
  n_papers_since_backup = 0
  n_papers_all_red = 10
  next_paper_id = 0

  updating = false // updating existing paper instead of adding new one
  id = -1 // id of paper being updated
  timeAdded = -1
  dialog = false
  title = ""
  url = ""
  tags: string[] = []
  priority = "0"
  authors = ""
  abstract = ""
  date = ""

  created() {
    loadFromDB(this, db)
  }
  open_link(url: string) {
    window.open(url)
  }
  delete_pd(idx: number) {
    this.deleted_pd = this.paper_data.splice(idx, 1)[0]
    this.deleted_pd_idx = idx
    this.show_undelete_snackbar = true
    db.papers.delete(this.deleted_pd.id)
  }
  undelete_pd() {
    this.show_undelete_snackbar = false
    if (this.deleted_pd !== null) {
      this.paper_data.splice(this.deleted_pd_idx, 0, this.deleted_pd)
      db.papers.add(this.deleted_pd)
    }
  }
  edit_pd(idx: number) {
    const pd = this.paper_data[idx]
    this.updating = true
    this.priority = pd.priority.toString()
    this.tags = pd.tags
    this.title = pd.title
    this.url = pd.url
    this.abstract = pd.abstract
    this.authors = pd.authors.join(", ")
    this.id = pd.id
    this.timeAdded = pd.time_added
    this.date = pd.date
    this.dialog = true
  }
  async download_data() {
    try {
      // const jsonBlob = await db.export({prettyJson: true})
      const jsonBlob = exportDB(db, {prettyJson: true})
      const date = new Date().toLocaleDateString().replace(/\//g, "_")
      const mime_type = "text/json"
      const a = document.createElement("a")
      a.download = `paper_data_backup__${date}.json`
      a.href = window.URL.createObjectURL(jsonBlob)
      a.dataset.downloadurl = [mime_type, a.download, a.href].join(":")
      a.click()

      // TODO: these two lines should only run if you actually download the file
      // (not if you cancel saving it)
      this.n_papers_since_backup = 0
      db.meta.update(0, {n_papers_since_backup: this.n_papers_since_backup, next_paper_id: this.next_paper_id, tags: this.all_tags})
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
    // await Dexie.import(jsonFile, {overwriteValues: true})
    importInto(db, jsonFile, {overwriteValues: true})
    loadFromDB(this, db)
    this.n_papers_since_backup = this.n_papers_all_red
    db.meta.update(0, {n_papers_since_backup: this.n_papers_since_backup, next_paper_id: this.next_paper_id, tags: this.all_tags})
  }
  // TODO: I removed activate_slider here

  // TODO: try using a normal sort instead of this and see if it really makes a
  // noticeable difference. Get rid of this function if normal sort is fast enough
  sort_nearly_sorted_array(array: any[], idx: number) {
    // WARNING - this operation is in-place!
    // array must be an array of objects sorted in descening order by a property
    // called priority except that the object array[idx] may be out of order.
    // swap the out-of-order item left or right until it's in order

    const obj = array[idx]
    while (idx < array.length - 1 && obj.priority <= array[idx + 1].priority) {
      [array[idx], array[idx + 1]] = [array[idx + 1], array[idx]]
      idx += 1
    }
    while (idx > 0 && obj.priority > array[idx - 1].priority) {
      [array[idx], array[idx - 1]] = [array[idx - 1], array[idx]]
      idx -= 1
    }
  }
  add_paper(save: boolean) {
    this.dialog = false
    if(save) {
      let paper = {
        tags: this.tags.map(tag => tag.trim()),
        title: this.title,
        url: this.url,
        priority: parseFloat(this.priority),
        authors: this.authors.split(", "),
        abstract: this.abstract,
        id: this.updating? this.id : this.next_paper_id,
        time_added: this.updating? this.timeAdded : Date.now(),
        date: this.date,
      }
      if (!this.updating) {
        this.next_paper_id += 1
      }
      db.papers.put(paper)
      this.paper_temp_data[paper.id] = {
        show_slider: false,
        search_string: `${paper.title.toLowerCase()} ${paper.abstract.toLowerCase()}`,
        search_tags: getPrefixSet(paper.tags),
        date_string: new Date(paper.date || paper.time_added).toLocaleString("default", {month: "short", year: "numeric"}),
      }
      db.papers.toArray().then((papers) => {
        this.paper_data = papers
      })

      this.all_tags = [...new Set(this.all_tags.concat(paper.tags))]
      this.n_papers_since_backup += 1
      db.meta.update(0, {n_papers_since_backup: this.n_papers_since_backup, next_paper_id: this.next_paper_id, tags: this.all_tags})
    }
    this.title = ""
    this.url = ""
    this.tags = []
    this.priority = "0"
    this.authors = ""
    this.abstract = ""
    this.date = ""
    this.updating = false
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
    const red = Math.round(255 * Math.min(this.n_papers_since_backup / this.n_papers_all_red, 1))
    return `rgba(${red}, 0, 0, 1)`
  }
}

// TODO: pull db things into a separate .ts file then just do `import db from "db.ts"`
type Meta = {
    id: number,
    n_papers_since_backup: number,
    next_paper_id: number,
    tags: string[],
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
    }
}

const db = new PapersDb("paper-helper")

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
      vue.n_papers_since_backup = 0
      db.meta.add({id: 0, n_papers_since_backup: 0, next_paper_id: 0, tags: []})
    } else {
      if (meta.length > 1) {
        console.log("Warning: found multiple meta entries.")
        console.log(meta)
      }
      let meta0 = meta[0]
      vue.n_papers_since_backup = meta0["n_papers_since_backup"]
      vue.next_paper_id = meta0["next_paper_id"]
      vue.all_tags = meta0["tags"]
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
.abstract {
  font-size: medium;
}

.v-expansion-panel-header {
  padding: 10px 16px;
}

.v-card__title {
  padding: 0px;
}

.v-card__actions {
  padding: 0px;
}

.v-chip {
  margin-right: 4px;
}
</style>
