const router = require("express").Router()
const stringify = require("json-stringify-safe")
const cors = require("cors")
const firebase = require("firebase")
const logging = require("../lib/logging")
const nestedError = require("../lib/nestedError")
const setupWebHook = require("../lib/setup-webhook")
const firebaseValidator = require("../middlewares/firebase-validator")

const PATH = "/setup"

router.use(PATH, require("body-parser").json())
router.use(PATH, firebaseValidator)
router.post(PATH, cors(), (req, res) => {

  const logger = logging("setup", {
    type: "gae_app"
  })

  if (!req.body || !req.body.firebaseUID || !req.body.owner || !req.body.repo) {
    logger.error({
      message: "Error: Invalid Parameter",
      payload: stringify(req, null, "  ")
    })
    res.status(400).json({ error: "Invalid parameter" })
    return
  }

  logger.info({
    message: "Request /setup",
    body: req.body
  })

  const UID = req.body.firebaseUID
  const owner = req.body.owner
  const repo = req.body.repo

  firebase.database()
    .ref("users")
    .child(`${UID}/access_token`)
    .once("value")
    .then(snap => Promise.resolve(snap.val()))
    .then(token => setupWebHook(token, owner, repo))
    .then(hook => {
      logger.info({
        message: "Create Webhook",
        payload: stringify(hook, null, "  ")
      })
      return hook
    })
    .then(hook => res.status(200).json(hook))
    .catch(error => {
      logger.error({
        message: "/setup error",
        payload: stringify(error, null, "  ")
      })

      res.status(500).json(nestedError(error, "Internal Server Error"))
    })
})

module.exports = router
