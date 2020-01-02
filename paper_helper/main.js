let vue = new Vue({
  el: '#app',
  vuetify: new Vuetify({icons: {iconfont: "md"}}),
  data: {
    paper_data: [],
    query: "",
    query_tags: "",
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
    vue.paper_data = paper_data
    paper_data.forEach(pd => pd.search_string = `${pd.title.toLowerCase()} ${pd.abstract.toLowerCase()}`)
    paper_data.forEach(pd => pd.search_tags = new Set(pd.tags.map(tag => tag.toLowerCase())))
  }
})
