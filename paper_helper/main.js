const vue = new Vue({
  el: '#app',
  vuetify: new Vuetify({icons: {iconfont: "md"}}),
  data: {
    paper_data: [],
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
      this.save_paper_data()
    },
    undelete_pd: function () {
      this.show_undelete_snackbar = false
      this.paper_data.splice(this.deleted_pd_idx, 0, this.deleted_pd)
      this.save_paper_data()
    },
    edit_pd: function(idx) {
      console.log(`Editing ${idx} (TODO)`)
    },
    save_paper_data: function () {
      console.log("Saving data... (TODO)")
      // chrome.storage.local.set({paper_data: this.paper_data})
    },
    download_data: function () {
      const vue = this
      // chrome.storage.local.get(["tags"], function(result) {
      //   const date = new Date().toLocaleDateString().replace(/\//g, "_")
      //   const fname = `paper_data_backup__${date}.json`
      //   const mime_type = "text/json"
      //   const all_data = {paper_data: vue.paper_data, tags: result.tags}
      //   const blob = new Blob([JSON.stringify(all_data)], {type: mime_type})
      //   const a = document.createElement("a")
      //   a.download = fname
      //   a.href = window.URL.createObjectURL(blob)
      //   a.dataset.downloadurl = [mime_type, a.download, a.href].join(":")
      //   a.click()
      //   vue.n_papers_since_backup = 0
      //   // chrome.storage.local.set({n_papers_since_backup: 0})
      // })
    },
    load_file: function () {
      const vue = this
      const file_picker = document.createElement("input")
      file_picker.type = "file"
      file_picker.accept = "application/json"
      file_picker.addEventListener("change", function(event) {
        const input = event.target
        if ("files" in input && input.files.length > 0) {
          const reader = new FileReader()
          reader.onload = event => vue.load_data(event.target.result)
          reader.onerror = error => reject(error)
          reader.readAsText(input.files[0])
        }
      })
      file_picker.click()
    },
    load_data: function (data_string) {
      const data = JSON.parse(data_string)
      this.paper_data = this.paper_data.concat(data.paper_data || [])
      // chrome.storage.local.get(["tags"], function(result) {
      //   const tags = (data.tags || []).concat(result.tags || [])
      //   chrome.storage.local.set({tags})
      // })
      this.save_paper_data()
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
        // chrome.storage.local.set({paper_data: this.paper_data})
        // chrome.storage.local.set({tags: this.all_tags})
        // chrome.storage.local.get(["n_papers_since_backup"], function(result) {
        //   const n_papers_since_backup = result["n_papers_since_backup"] || 0
        //   chrome.storage.local.set({n_papers_since_backup: n_papers_since_backup + 1})
        // })
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

// chrome.storage.local.get(["paper_data", "n_papers_since_backup"], function(result) {
//   const paper_data = result["paper_data"]
//   if (paper_data != null) {
//     // do this before assigning to vue so `show_slider` is reactive
//     paper_data.forEach(pd => pd.show_slider = false)
//     vue.paper_data = paper_data
//     // these don't need to be reactive; assign later just in case it speeds up rendering
//     paper_data.forEach(pd => pd.search_string = `${pd.title.toLowerCase()} ${pd.abstract.toLowerCase()}`)
//     paper_data.forEach(pd => pd.search_tags = new Set(pd.tags.map(tag => tag.toLowerCase())))
//     paper_data.forEach(pd => pd.date_string = new Date(pd.date || pd.time).toLocaleString("default", {month: "short", year: "numeric"}))
//   }

//   const n_papers_since_backup = result["n_papers_since_backup"]
//   if (n_papers_since_backup != null) {
//     vue.n_papers_since_backup = n_papers_since_backup
//   }
// })
