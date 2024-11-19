# remember to collect all the new tags and add them when you import papers

import json
import uuid
from pathlib import Path
import sys

def convert(json_path, paper_dir):
    data = json.loads(Path(json_path).read_text())
    papers = data["paper_data"]
    paper_dir = Path(paper_dir)
    paper_dir.mkdir(exist_ok=True)

    if (
        data.keys() == {"paper_data", "tags"}
        and data["paper_data"]
        and data["paper_data"][0].keys() == {'abstract', 'arxiv_id', 'authors', 'date', 'date_string', 'pdf_url', 'priority', 'search_string', 'search_tags', 'show_slider', 'tags', 'time', 'title', 'url'}
    ):
        delete_metadata = {"date_string", "search_string", "search_tags", "show_slider", "pdf_url"}
        remap_metadata = {"abstract": "content", "date": "paperDate", "time": "timeAdded", "arxiv_id": "arxivId"}
    else:
        raise RuntimeError(f"No converter found for data with {data.keys()} and papers with {papers[0].keys()}")

    for paper in papers:
        paper = {
            remap_metadata.get(k, k): v for k, v in paper.items() if k not in delete_metadata
        }
        header = "\n".join(f"{k} = {json.dumps(v)}" for k, v in paper.items() if k != "content")
        md = f"---\n{header}\n---\n\n{paper['content']}"
        (paper_dir / f"{uuid.uuid4().hex}.md").write_text(md)
    print(f"Converted {len(papers)} entries. Output is in {paper_dir.resolve()}.")


if __name__ == "__main__":
    if not len(sys.argv) == 3:
        print("Usage: convert_old_data <json_path> <output_dir>")
        sys.exit(1)
    convert(sys.argv[1], sys.argv[2])
