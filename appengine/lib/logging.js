/* eslint-disable no-console */
"use strict"

const debug = require("debug")("rocket")

const gcloud = require("google-cloud")
const credential = {
  projectId: "rocket-ci",
  keyFilename: "cred/trigger-build.json"
}

const logging = gcloud.logging(credential)

const DISABLE_CLOUD_LOGGING = process.env.DISABLE_CLOUD_LOGGING != undefined
debug(`DISABLE_CLOUD_LOGGING is ${DISABLE_CLOUD_LOGGING}`)

module.exports = function(name, resource) {

  if (!resource || !resource.type) {
    throw new Error(`Invalid argument: resource = ${resource}`)
  }

  const baseMetadata = {
    resource
  }

  const log = logging.log(name);
  return {
    info: msg => {

      debug(msg)

      if (!DISABLE_CLOUD_LOGGING) {
        const metadata = Object.assign({}, baseMetadata, { timestamp: new Date })
        const entry = log.entry(metadata, msg)
        log.info(entry, err => { if (err) { console.error("log.info error", err) } })
      }

    },
    error: msg => {

      debug("error", msg)

      if (!DISABLE_CLOUD_LOGGING) {
        const metadata = Object.assign({}, baseMetadata, { timestamp: new Date })
        const entry = log.entry(metadata, msg)
        log.error(entry, err => { if (err) { console.error("log.error error", err) } })
      }
    }
  }
}

