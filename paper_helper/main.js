const vue = new Vue({
  el: '#app',
  vuetify: new Vuetify({icons: {iconfont: "md"}}),
  data: {
    done_loading: false,
    paper_data: [],
    paper_temp_data: {},
    all_tags: [],
    query: "",
    query_tags: "",
    min_priority: -100,
    max_priority: 100,
    deleted_pd: {},
    deleted_pd_idx: -1,
    show_undelete_snackbar: false,
    n_papers_since_backup: 0,
    n_papers_all_red: 10,
    next_paper_id: 0,

    dialog: false,
    title: "",
    url: "",
    tags: [],
    priority: "0",
    authors: "",
    abstract: "",
    metadata: {},
  },
  methods: {
    open_link: function (url) {
      window.open(url)
    },
    delete_pd: function (idx) {
      this.deleted_pd = this.paper_data.splice(idx, 1)[0]
      this.deleted_pd_idx = idx
      this.show_undelete_snackbar = true
      db.papers.delete(this.deleted_pd.id)
    },
    undelete_pd: function () {
      this.show_undelete_snackbar = false
      this.paper_data.splice(this.deleted_pd_idx, 0, this.deleted_pd)
      db.papers.add(this.deleted_pd)
    },
    edit_pd: function(idx) {
      console.log(`Editing ${idx} (TODO)`)
    },
    download_data: async function () {
      try {
        const jsonBlob = await db.export({prettyJson: true})
        console.log(jsonBlob)
        const date = new Date().toLocaleDateString().replace(/\//g, "_")
        const mime_type = "text/json"
        const a = document.createElement("a")
        a.download = `paper_data_backup__${date}.json`
        a.href = window.URL.createObjectURL(jsonBlob)
        a.dataset.downloadurl = [mime_type, a.download, a.href].join(":")
        a.click()

        this.n_papers_since_backup = n_papers_all_red
        db.meta.update(0, {n_papers_since_backup: this.n_papers_since_backup, next_paper_id: this.next_paper_id, tags: this.all_tags})
      } catch (error) {
        console.error(error)
      }
    },
    load_file: function () {
      const vue = this
      const file_picker = document.createElement("input")
      file_picker.type = "file"
      file_picker.accept = "application/json"
      file_picker.addEventListener("change", function(event) {
        const input = event.target
        if ("files" in input && input.files.length > 0) {
          vue.load_data(input.files[0])
        }
      })
      file_picker.click()
    },
    load_data: async function (jsonFile) {
      await Dexie.import(jsonFile, {overwriteValues: true})
      loadFromDB(this, db)
    },
    activate_slider: function (paper_data, idx) {
      paper_data.show_slider = true

      /* this is a bit hacky, but I want the slider to follow the mouse without needing
        to click on it again and for it to be easy to remove the slider. The desired workflow is
        to use a mousedown (without up) to open the slider, move the mouse appropriately, then
        use mouseup to close the slider. I'm not enforcing that only one slider is shown at the
        same time, but I'm also not trying to make things work well for that case.

        A method that seems better would be to do a mousedown on the slider when it's created; that
        should achieve the same effect of having the slider follow the mouse but without so much
        work here. I couldn't get the slider to respond to mousedown or click events, though. E.g.
        I tried refs[`slider${paper_data.time}`][0].mousedown().
        I also tried to use @mousemove on the slider to update the priority, but that doesn't seem
        to get called...
      */
      const vue = this
      // the ref for the slider won't exist until the next tick
      Vue.nextTick().then(function () {
        const rect = vue.$refs[`slider${paper_data.time}`][0].$el.getBoundingClientRect()

        const remove_handlers = function (event) {
          document.onmousemove = null
          document.onmouseup = null
          document.onclick = null
          paper_data.show_slider = false
          vue.sort_nearly_sorted_array(vue.paper_data, idx)
          vue.save_paper_data()
        }
        document.onclick = remove_handlers
        document.onmouseup = remove_handlers

        document.onmousemove = function (event) {
          x = Math.max(event.pageX, rect.x)
          x = Math.min(x, rect.x + rect.width)
          paper_data.priority = vue.min_priority + (event.pageX - rect.x) / rect.width * (vue.max_priority - vue.min_priority)
        }
      })
    },
    // TODO: try using a normal sort instead of this and see if it really makes a
    // noticeable difference. Get rid of this function if normal sort is fast enough
    sort_nearly_sorted_array: function (array, idx) {
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
    },
    add_paper: function(save) {
      this.dialog = false
      if(save) {
        const priority = parseFloat(this.priority)
        const tags = this.tags.map(tag => tag.trim().toLowerCase())
        let new_paper_data = {
          ...this.metadata,
          tags,
          title: this.title,
          url: this.url,
          priority: priority,
          authors: this.authors.split(", "),
          abstract: this.abstract,
          id: this.next_paper_id,
        }
        let inserted = false
        for ([idx, data] of this.paper_data.entries()) {
          if (data.priority < priority) {
            this.paper_data.splice(idx, 0, new_paper_data)
            inserted = true
            break
          }
        }
        if (!inserted) {
          this.paper_data.push(new_paper_data)
        }
        this.all_tags = [...new Set(this.all_tags.concat(tags))]
        db.papers.add(new_paper_data)
        this.n_papers_since_backup += 1
        this.next_paper_id += 1
        db.meta.update(0, {n_papers_since_backup: this.n_papers_since_backup, next_paper_id: this.next_paper_id, tags: this.all_tags})
        this.paper_temp_data[new_paper_data.id] = {"show_slider": false}
      }
      this.title = ""
      this.url = ""
      this.tags = []
      this.priority = "0"
      this.authors = ""
      this.abstract = ""
    },
  },
  computed: {
    filtered_paper_data: function () {
      let data = this.paper_data // direct reference; don't mutate!
      if (this.query_tags != "") {
        const query_tags = this.query_tags.toLowerCase().split(", ")
        data = data.filter(pd => query_tags.every(tag => pd.search_tags.has(tag)))
      }
      if (this.query != "") {
        const query = this.query.toLowerCase()
        data = data.filter(pd => pd.search_string.includes(query))
      }
      return data
    },
    download_red: function () {
      const red = Math.round(255 * Math.min(this.n_papers_since_backup / this.n_papers_all_red, 1))
      return `rgba(${red}, 0, 0, 1)`
    },
  },
})

let db = new Dexie("paper-helper")
db.version(1).stores({
  // only declare properties you want to index (use in .where())
  papers: "id, title, abstract, tags",
  meta: "id", // n_papers_since_backup, next_paper_id, tags
})

function loadFromDB(vue, db) {
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
      meta = meta[0]
      vue.n_papers_since_backup = meta["n_papers_since_backup"]
      vue.next_paper_id = meta["next_paper_id"]
      vue.all_tags = meta["tags"]
    }
  })
  db.papers.toArray().then((papers) => {
    papers.forEach(p => vue.paper_temp_data[p.id] = {
      show_slider: false,
      search_string: `${p.title.toLowerCase()} ${p.abstract.toLowerCase()}`,
      search_tags: new Set(p.tags.map(tag => tag.toLowerCase())),
      date_string: new Date(p.date || p.time).toLocaleString("default", {month: "short", year: "numeric"}),
    })
    vue.paper_data = papers
    vue.done_loading = true // assumes meta is already done loading
  })
}

loadFromDB(vue, db)
