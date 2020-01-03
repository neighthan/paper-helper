let vue = new Vue({
  el: '#app',
  vuetify: new Vuetify({icons: {iconfont: "md"}}),
  data: {
    paper_data: [],
    query: "",
    query_tags: "",
    min_priority: -100,
    max_priority: 100,
  },
  methods: {
    open_link: function (url) {
      chrome.tabs.create({url})
    },
    activate_slider: function (paper_data) {
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
    }
  },
})

let pd_promise = new Promise(function(resolve) {
  chrome.storage.local.get(["paper_data"], function(result) {
    resolve(result)
  })
})
pd_promise.then(function(result) {
  let paper_data = result["paper_data"]
  console.log(paper_data)
  if (paper_data != null) {
    // do this before assigning to vue so `show_slider` is reactive
    paper_data.forEach(pd => pd.show_slider = false)
    vue.paper_data = paper_data
    // these don't need to be reactive; assign later just in case it speeds up rendering
    paper_data.forEach(pd => pd.search_string = `${pd.title.toLowerCase()} ${pd.abstract.toLowerCase()}`)
    paper_data.forEach(pd => pd.search_tags = new Set(pd.tags.map(tag => tag.toLowerCase())))
  }
})
