<template>
  <div class="expansion-item">
    <v-expansion-panel-header hide-actions>
      <v-card class="mx-auto" flat>
        <v-card-title>{{entry.title}}</v-card-title>
        <v-card-actions>
          <v-tooltip v-if="entry.url" right>
            <template v-slot:activator="{on}">
              <v-btn text v-on="on" @click.native.stop="open_link(entry.url)">
                Open
              </v-btn>
            </template>
            <span>{{entry.url}}</span>
          </v-tooltip>
          <v-btn v-else text disabled>Open</v-btn>

          <v-col v-if="editingPriority" cols="1" class="ma-0 pa-0">
            <v-text-field
              autofocus dense hide-details="auto"
              v-model.number="priority" type="number"
              @keyup.enter="commitPriority" @click.stop=""
            ></v-text-field>
          </v-col>
          <v-tooltip top v-else>
            <template v-slot:activator="{on}">
              <v-btn icon v-on="on" @mousedown.native.stop="editPriority(entry)">
                <v-icon>swap_vert</v-icon>
              </v-btn>
            </template>
            <span>{{entry.priority}}</span>
          </v-tooltip>

          <v-btn icon @click.native.stop="deleteEntry()">
            <v-icon>delete</v-icon>
          </v-btn>

          <v-btn icon @click.native.stop="editEntry()">
            <v-icon>edit</v-icon>
          </v-btn>

          <v-btn icon @click.native.stop="addNotes()">
            <v-icon>open_in_new</v-icon>
          </v-btn>

          <v-chip v-for="tag of entry.tags" :key="entry.id + tag" label outlined>{{tag}}</v-chip>

          <v-spacer></v-spacer>
          {{entry.dateString}}
        </v-card-actions>
      </v-card>
    </v-expansion-panel-header>
    <v-expansion-panel-content>
      <div class="abstract" v-html="mdNotes" style="text-align: left; word-wrap: break-word">
      </div>
    </v-expansion-panel-content>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator"
import {Entry} from "@/entries/entry"
import {renderMarkdown} from "../markdown"

@Component
export default class ExpansionItem extends Vue {
  @Prop() private entry!: Entry
  editingPriority = false
  priority: string | number = this.entry.priority
  min_priority = -100
  max_priority = 100
  imgCache = {}

  open_link(url: string) {
    window.open(url)
  }
  editEntry() {
    this.$emit("editEntry", this.entry)
  }
  deleteEntry() {
    this.$emit("deleteEntry", this.entry)
  }
  addNotes() {
    this.$emit("addNotes", this.entry)
  }
  editPriority(entry: Entry) {
    this.editingPriority = true
  }
  commitPriority() {
    this.editingPriority = false
    // priority should only be a string if an empty or invalid input was submitted
    if (typeof(this.priority) === "string") {
      this.priority = this.entry.priority
    }
    if (this.entry.priority != this.priority) {
      this.$emit("updatePriority", this.entry, this.priority)
    }
  }
  get mdNotes() {
    return renderMarkdown(this.entry.content, this.imgCache)
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
