let vue = new Vue({
  el: '#app',
  vuetify: new Vuetify(),
  data: {
    paper_data: [],
    paper_data_loaded: false,
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
  }
  vue.paper_data_loaded = true
})
