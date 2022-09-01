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
import Settings from "@/backend/settings"

const DB: any = 0
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
    this.userAgent = Settings.redditInfo.userAgent
    this.clientId = Settings.redditInfo.clientId
    this.clientSecret = Settings.redditInfo.clientSecret
    this.username = Settings.redditInfo.username
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
    Settings.redditInfo = this.redditData
  }
  cancel() {
    this.setFieldsFromDB()
    this.$emit("close")
  }
}
</script>

<style scoped lang="scss">
</style>
