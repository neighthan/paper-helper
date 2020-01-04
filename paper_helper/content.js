chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.method == "extract_metadata") {
      const metadata = {
        url: window.location.href,
        time: new Date().getTime(),
        title: "",
        date: "",
        arxiv_id: "",
        pdf_url: "",
        authors: [],
        abstract: "",
      }
      const host = window.location.host

      if (host === "arxiv.org") {
        const head = document.getElementsByTagName("head")[0]
        const meta_tags = Array(...head.childNodes).filter(node => node.tagName === "META")
        for (key of ["title", "date", "arxiv_id", "pdf_url"]) {
          metadata[key] = meta_tags.filter(node => node.name === `citation_${key}`)[0].content
        }
        metadata["authors"] = meta_tags
          .filter(node => node.name === "citation_author")
          // "Lastname, Firstname" -> "Firstname Lastname"
          .map(node => node.content.split(", ").reverse().join(" "))
        metadata["abstract"] = meta_tags
          .filter(node => node.attributes[0].value === "og:description")[0]
          .content.replace(/\n/g, " ")
      } else {
        try {
          metadata["title"] = document.getElementsByTagName("h1")[0].innerText
        } catch {}
      }
      sendResponse(metadata)
    } else {
      sendResponse({})
    }
  }
)
