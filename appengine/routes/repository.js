const async = require("async")
const express = require("express")
const router = express.Router()
const logging = require("../lib/logging")
const stringify = require("json-stringify-safe")

router.delete("/:repository_id/cache", (req, res) => {
  const logger = logging("delete_cache", {
    "type": "gae_app"
  })
  const repository_id = req.params.repository_id
  logger.info(`${repository_id}/cache を削除します`)
  const gcloud = require("google-cloud")
  const storage = gcloud.storage(require("../lib/gcloud_credential"))
  const file = storage
    .bucket("rocket-ci.appspot.com")
    .file(`caches/${repository_id}/cache.tar`)

  async.waterfall([
    (cb) => {
      file.exists(cb)
    },
    (exist, cb) => {
      if (!exist) {
        logger.error(`caches/${repository_id}/cache.tar がありませんでした`)
        cb("file not found")
      } else {
        file.delete(cb)
      }
    }
  ], (err) => {
    if (err) {
      logger.error({
        "message": `caches/${repository_id}/cache.tar の削除中にエラーが発生しました`,
        "payload": stringify(err, null, "  ")
      })
      if (err === "file not found") {
        res.sendStatus(404)
      } else {
        res.sendStatus(500)
      }
    } else {
      res.sendStatus(200)
    }
  })
})

module.exports = router
