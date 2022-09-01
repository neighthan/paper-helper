import {LogLevel} from "@/logger"
import {writeFile} from "./files"

const SETTINGS_PATH = "/settings.toml"

class Settings {
  protected _tags: string[]
  protected _dropboxToken: string
  protected _redditUserAgent: string
  protected _redditClientId: string
  protected _redditClientSecret: string
  protected _redditUsername: string
  protected _lastSyncTime: number
  protected _logLevel: LogLevel
  protected _syncDropbox: boolean

  constructor(
    tags: string[] = [],
    dropboxToken = "",
    redditUserAgent = "",
    redditClientId = "",
    redditClientSecret = "",
    redditUsername = "",
    lastSyncTime = -1,
    logLevel: LogLevel = "debug",
    syncDropbox = false,
  ) {
    this._tags = tags
    this._dropboxToken = dropboxToken
    this._redditUserAgent = redditUserAgent
    this._redditClientId = redditClientId
    this._redditClientSecret = redditClientSecret
    this._redditUsername = redditUsername
    this._lastSyncTime = lastSyncTime
    this._logLevel = logLevel
    this._syncDropbox = syncDropbox
  }

  get tags() {
    return this._tags
  }
  get dropboxToken() {
    return this._dropboxToken
  }
  get redditInfo() {
    return {
      userAgent: this._redditUserAgent,
      clientId: this._redditClientId,
      clientSecret: this._redditClientSecret,
      username: this._redditUsername,
    }
  }
  get lastSyncTime() {
    return this._lastSyncTime
  }
  get logLevel() {
    return this._logLevel
  }
  get syncDropbox() {
    return this._syncDropbox
  }
  set syncDropbox(syncDropbox: boolean) {
    this._syncDropbox = syncDropbox
    this._updateFile()
  }
  set tags(tags) {
    this._tags = tags
    this._updateFile()
  }
  set dropboxToken(dropboxToken) {
    this._dropboxToken = dropboxToken
    this._updateFile()
  }
  set redditInfo(data) {
    this._redditUserAgent = data.userAgent
    this._redditClientId = data.clientId
    this._redditClientSecret = data.clientSecret
    this._redditUsername = data.username
    this._updateFile()
  }
  set lastSyncTime(lastSyncTime: number) {
    this._lastSyncTime = lastSyncTime
    this._updateFile()
  }
  set logLevel(logLevel: LogLevel) {
    this._logLevel = logLevel
    this._updateFile()
  }
  toTOML() {
    return `
    tags = ${this._tags}
    dropboxToken = ${this._dropboxToken}
    redditUserAgent = ${this._redditUserAgent}
    redditClientId = ${this._redditClientId}
    redditClientSecret = ${this._redditClientSecret}
    redditUsername = ${this._redditUsername}
    lastSyncTime = ${this._lastSyncTime}
    logLevel = ${this._logLevel}
    syncDropbox = ${this._syncDropbox}
    `
  }
  _updateFile() {
    return writeFile(SETTINGS_PATH, this.toTOML())
  }
}

const SETTINGS = new Settings()

export default SETTINGS
