<template>
  <div class="expansion-item">
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

          <v-col v-if="editingPriority" cols="1" class="ma-0 pa-0">
            <v-text-field
              autofocus dense hide-details="auto"
              v-model.number="priority" type="number"
              @keyup.enter="commitPriority" @click.stop=""
            ></v-text-field>
          </v-col>
          <v-tooltip top v-else>
            <template v-slot:activator="{on}">
              <v-btn icon v-on="on" @mousedown.native.stop="editPriority(pd)">
                <v-icon>swap_vert</v-icon>
              </v-btn>
            </template>
            <span>{{pd.priority}}</span>
          </v-tooltip>

          <v-btn icon @click.native.stop="delete_pd()">
            <v-icon>delete</v-icon>
          </v-btn>

          <v-btn icon @click.native.stop="edit_pd()">
            <v-icon>edit</v-icon>
          </v-btn>

          <v-btn icon @click.native.stop="addNotes()">
            <v-icon>open_in_new</v-icon>
          </v-btn>

          <v-chip v-for="tag of pd.tags" :key="pd.id + tag" label outlined>{{tag}}</v-chip>

          <v-spacer></v-spacer>
          {{pd.date_string}}
        </v-card-actions>
      </v-card>
    </v-expansion-panel-header>
    <v-expansion-panel-content>
      <div class="abstract" v-html="mdAbstract" style="text-align: left">
      </div>
    </v-expansion-panel-content>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator"
import { PaperData } from "@/paper_types"
import {renderMarkdown} from "../markdown"

@Component
export default class ExpansionItem extends Vue {
  @Prop() private pd!: PaperData
  editingPriority = false
  priority: string | number = this.pd.priority
  min_priority = -100
  max_priority = 100

  open_link(url: string) {
    window.open(url)
  }
  edit_pd() {
    this.$emit("edit_pd", this.pd)
  }
  delete_pd() {
    this.$emit("delete_pd", this.pd)
  }
  addNotes() {
    this.$emit("addNotes", this.pd)
  }
  editPriority(paper: PaperData) {
    this.editingPriority = true
  }
  commitPriority() {
    this.editingPriority = false
    // priority should only be a string if an empty or invalid input was submitted
    if (typeof(this.priority) === "string") {
      this.priority = this.pd.priority
    }
    if (this.pd.priority != this.priority) {
      this.$emit("updatePriority", this.pd, this.priority)
    }
  }
  get mdAbstract() {
    return renderMarkdown(this.pd.abstract, () => {
      // This is just to make Vue re-render by making it think the abstract changed.
      // Is there a better method for this?
      let abstract = this.pd.abstract
      Vue.set(this.pd, "abstract", "")
      Vue.set(this.pd, "abstract", abstract)
    })
  }
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

.v-tooltip__content {
  font-size: 14px;
  padding: 3px 5px;
}
</style>
