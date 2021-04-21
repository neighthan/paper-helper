<template>
  <div>
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

          <v-col v-if="editingPriority" cols="8" sm="4" md="2">
            <v-slider v-model="pd.priority" :min="min_priority" :max="max_priority" thumb-label="always"
              thumb-size="24" hide-details height="5" :ref="'slider' + pd.id"></v-slider>
          </v-col>
          <v-tooltip top v-else>
            <template v-slot:activator="{on}">
              <v-btn icon v-on="on" @mousedown.native.stop="editPriority(pd)">
                <v-icon>swap_vert</v-icon>
              </v-btn>
            </template>
            <span>{{pd.priority}}</span>
          </v-tooltip>

          <v-btn icon @click.native.stop="delete_pd(idx)">
            <v-icon>delete</v-icon>
          </v-btn>

          <v-btn icon @click.native.stop="edit_pd(idx)">
            <v-icon>edit</v-icon>
          </v-btn>

          <v-chip v-for="tag of pd.tags" :key="pd.id + tag" label outlined>{{tag}}</v-chip>

          <v-spacer></v-spacer>
          {{pd.date_string}}
        </v-card-actions>
      </v-card>
    </v-expansion-panel-header>
    <v-expansion-panel-content>
      <span class="abstract">
        {{pd.abstract}}
      </span>
    </v-expansion-panel-content>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator"
import { PaperData } from "@/paper_types"

@Component
export default class ExpansionItem extends Vue {
  @Prop() private pd!: PaperData
  @Prop() private idx!: number
  editingPriority = false

  open_link(url: string) {
    window.open(url)
  }
  edit_pd(idx: number) {
    this.$emit("edit_pd", idx)
  }
  delete_pd(idx: number) {
    this.$emit("delete_pd", idx)
  }
  editPriority(paper: PaperData) {
    console.log("TODO: edit priority for", paper)
    // probably add a data field for edited priority, change to a text box with that
    // as the model, then emit an event for Home.vue to update the paper once the user
    // commits to the new priority (we need Home.vue to do this so that all the entries
    // can be re-sorted)
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
