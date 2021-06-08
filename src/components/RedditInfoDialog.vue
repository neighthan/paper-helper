<template>
  <div id="reddit-info-dialog">
    <v-card>
      <v-card-text>
        <v-text-field label="User Agent" v-model="userAgent" dense autofocus></v-text-field>
        <v-text-field label="Client ID" v-model="clientId" dense></v-text-field>
        <v-text-field label="Client Secret" v-model="clientSecret" dense></v-text-field>
        <v-text-field label="Username" v-model="username" dense></v-text-field>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions>
        <v-btn color="primary" text @click="save">
          Save
        </v-btn>
        <v-btn color="error" text @click="cancel">
          Cancel
        </v-btn>
        <v-spacer></v-spacer>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator"
import {DB, getMeta} from "../db"

// type Data = {
//   userAgent: string,
//   clientId: string,
//   clientSecret: string,
//   username: string,
// }

@Component
export default class RedditInfoDialog extends Vue {
  userAgent = ""
  clientId = ""
  clientSecret = ""
  username = ""

  mounted() {
    this.setFieldsFromDB()
  }

  async setFieldsFromDB() {
    const meta = await getMeta(DB)
    this.userAgent = meta.redditInfo.userAgent
    this.clientId = meta.redditInfo.clientId
    this.clientSecret = meta.redditInfo.clientSecret
    this.username = meta.redditInfo.username
  }

  get redditData() {
    return {
      userAgent: this.userAgent,
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      username: this.username,
    }
  }
  async save() {
    this.$emit("close")
    const meta = await getMeta(DB)
    meta.redditInfo = this.redditData
  }
  cancel() {
    this.setFieldsFromDB()
    this.$emit("close")
  }
}
</script>

<style scoped lang="scss">
</style>
