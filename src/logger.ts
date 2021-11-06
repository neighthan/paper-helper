type LogLevel = "silent" | "error" | "warn" | "info" | "debug" | "trace"


// the higher the number, the more you're logging
const logLevels: {[key in LogLevel]: number} = {"silent": -1, "error": 0, "warn": 1, "info": 2, "debug": 3, "trace": 4};

/**
 * logLevel: one of {'silent', 'error', 'warn', 'info', 'debug', 'trace'} (in order of
 * increasing verbosity)
 */
class Logger {
  protected _logLevel: number
  constructor(logLevel?: LogLevel) {
    this._logLevel = logLevels.silent
    if (logLevel === undefined) return
    try {
      this._logLevel = logLevels[logLevel]
    } catch (e) {}
  }

  get logLevel() {
    for (const [lvlString, lvlNum] of Object.entries(logLevels)) {
      if (lvlNum === this._logLevel) return <LogLevel>lvlString
    }
    return "silent"
  }
  set logLevel(logLevel: LogLevel) {
    this._logLevel = logLevels[logLevel]
  }

  error(...data: any[]) {
    if (this._logLevel >= logLevels.error) {
      this._log(...data)
    }
  }
  warn(...data: any[]) {
    if (this._logLevel >= logLevels.warn) {
      this._log(...data)
    }
  }
  info(...data: any[]) {
    if (this._logLevel >= logLevels.info) {
      this._log(...data)
    }
  }
  debug(...data: any[]) {
    if (this._logLevel >= logLevels.debug) {
      this._log(...data)
    }
  }
  trace(...data: any[]) {
    if (this._logLevel >= logLevels.trace) {
      this._log(...data)
    }
  }
  protected _log(...data: any[]) {
    console.log(...data)
  }
}

const logger = new Logger()
export {logger, Logger, LogLevel, logLevels}
