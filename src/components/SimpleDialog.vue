<template>
  <div>
    <v-dialog v-model="showDialog">
      <v-card>
        <v-card-title>{{title}}</v-card-title>
        <v-card-text>
          <v-text-field
            v-for="[objKey, label] of fields"
            :key="objKey"
            :label="label"
            v-model="vals[objKey]"
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

/**
 * Example:
 * `<SimpleDialog title="Title" iconName="mdi-plus" :fieldNames="['Month', 'Year']" @save="setMonthYear"/>`
 * will call `setMonthYear({Month: month, Year: year})`
 *
 * You can either given fieldNames as a string[] where the strings are used as both the
 * labels for the textfields and the keys in the object or as a [string, string][] where
 * the first string is the object key and the second is the textfield label.
 */
@Component
export default class SimpleDialog extends Vue {
  @Prop() title!: string
  @Prop() iconName!: string
  @Prop() fieldNames!: string[] | [string, string][]
  @Prop({default: "Save"}) confirmBtnText!: string
  @Prop({default: "Cancel"}) cancelBtnText!: string
  fields: [string, string][] = []
  showDialog = false
  vals: {[key: string]: string} = {}

  convertFieldNames(fieldNames: string[] | [string, string][]) {
    if (typeof fieldNames[0] === "string") {
      this.fields = (fieldNames as string[]).map(name => [name, name])
    } else {
      this.fields = fieldNames as [string, string][]
    }
  }

  created() {
    this.convertFieldNames(this.fieldNames)
    this.updateFields(this.fields, [])
  }

  @Watch("fieldNames")
  updateFields(newFields: string[] | [string, string][], oldFields: string[] | [string, string][]) {
    this.convertFieldNames(newFields)
    this.vals = {}
    for (const field of this.fields) {
      Vue.set(this.vals, field[0], "")
    }
  }

  save() {
    const retVals = Object.assign({}, this.vals)
    // reset any changes so they won't show if you open this dialog again
    this.updateFields(this.fields, [])
    this.showDialog = false
    this.$emit("save", retVals)
  }

  cancel() {
    // reset any changes so they won't show if you open this dialog again
    this.updateFields(this.fields, [])
    this.showDialog = false
  }
}
</script>

<style scoped lang="scss">
</style>
