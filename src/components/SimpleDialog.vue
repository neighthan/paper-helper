<template>
  <div>
    <v-dialog v-model="showDialog">
      <v-card>
        <v-card-title>{{title}}</v-card-title>
        <v-card-text>
          <v-text-field
            v-for="field of fieldNames"
            :key="field"
            :label="field"
            v-model="vals[field]"
          >
          </v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-btn text @click="save" color="blue">{{confirmBtnText}}</v-btn>
          <v-btn text @click="cancel" color="red">{{cancelBtnText}}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-btn icon @click="showDialog = true"><v-icon>{{iconName}}</v-icon></v-btn>
  </div>
</template>

<script lang="ts">
import {Component, Vue, Prop, Watch} from "vue-property-decorator"

@Component
export default class SimpleDialog extends Vue {
  @Prop() title!: string
  @Prop() iconName!: string
  @Prop() fieldNames!: string[]
  @Prop({default: "Save"}) confirmBtnText!: string
  @Prop({default: "Cancel"}) cancelBtnText!: string
  showDialog = false
  vals: {[key: string]: string} = {}

  created() {
    this.updateFields(this.fieldNames, [])
  }

  @Watch("fieldNames")
  updateFields(newFields: string[], oldFields: string[]) {
    this.vals = {}
    for (const field of newFields) {
      Vue.set(this.vals, field, "")
    }
  }

  save() {
    const retVals = Object.assign({}, this.vals)
    // reset any changes so they won't show if you open this dialog again
    this.updateFields(this.fieldNames, [])
    this.showDialog = false
    this.$emit("save", retVals)
  }

  cancel() {
    // reset any changes so they won't show if you open this dialog again
    this.updateFields(this.fieldNames, [])
    this.showDialog = false
  }
}
</script>

<style scoped lang="scss">
</style>
