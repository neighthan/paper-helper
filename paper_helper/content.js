chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.method == "extract_metadata") {
      let metadata = {url: window.location.href, time: new Date().getTime()}
      let host = window.location.host

      if (host === "arxiv.org") {
        let head = document.getElementsByTagName("head")[0]
        let meta_tags = Array(...head.childNodes).filter(node => node.tagName === "META")
        for (key of ["title", "date", "arxiv_id", "pdf_url"]) {
          metadata[key] = meta_tags.filter(node => node.name === `citation_${key}`)[0].content
        }
        metadata["authors"] = meta_tags.filter(node => node.name === "citation_author").map(node => node.content)
        metadata["abstract"] = meta_tags.filter(node => node.attributes[0].value === "og:description")[0].content
      } else {
        try {
          metadata["title"] = document.getElementsByTagName("h1")[0].innerText
        } catch (e) {
          metadata["title"] = ""
        }
      }
      sendResponse(metadata)
    } else {
      sendResponse({})
    }
  }
)
