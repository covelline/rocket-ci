const router = require("express").Router()
const xhub = require("express-x-hub")
const logging = require("../lib/logging")
const shouldBuild = require("../lib/should_build")
const stringify = require("json-stringify-safe")

const { GITHUB_SIGNATURE } = process.env

module.exports = function(compute) {
  const trigger = require("../lib/trigger")(compute)

  router.use("/", xhub({ algorithm: "sha1", secret: GITHUB_SIGNATURE }))
  router.use("/", require("body-parser").json())
  router.post("/", (req, res) => {
    const logger = logging("hooks", {
      "type": "gae_app",
      "labels": {
        "github_delivery": req.get("X-GitHub-Delivery")
      }
    })
    logger.info({
      "message": "処理を開始します",
      "request": stringify(req.body, null, "  ")
    })
    if (!req.isXHubValid) {
      logger.error({
        "message": "正しいクライアントからのリクエストではありませんでした",
        "request": stringify(req, null, "  ")
      })
      res.sendStatus(403)
      logger.info("処理を終了します")
      return
    }
    if (!req.isXHubValid()) {
      logger.error({
        "message": "正しいクライアントからのリクエストではありませんでした",
        "request": stringify(req, null, "  ")
      })
      res.sendStatus(403)
      logger.info("処理を終了します")
      return
    }
    const event = req.get("X-GitHub-Event")
    const triggered = (err, result) => {
      if (err) {
        logger.error({
          "message": "パラメータが不正でした",
          "error": `${err.name} ${err.message}`
        })
        res.sendStatus(403)
      } else {
        res.status(202).json(result)
      }
    }
    const finished = (err) => {
      if (err) {
        logger.error({
          "message": "処理を終了します",
          "error": `${err.name} ${err.message}`
        })
      } else {
        logger.info("処理を終了します")
      }
    }
    const buildLogMessage = (event, req) => {
      const message = []
      message.push(`発生したイベント: ${event}`)
      if (req.body.action) {
        message.push(`アクション: ${req.body.action}`)
      }
      if (req.body.issue) {
        message.push(`プルリクエストのコメント: ${req.body.issue.pull_request != null}`)
        message.push(`コメントの内容: ${req.body.comment.body}`)
      }
      if (req.body.build_number) {
        message.push(`ビルド番号: ${req.body.build_number}`)
      }
      return message.join(", ")
    }
    if (shouldBuild.onPullRequest(event, req.body)) {
      logger.info(buildLogMessage(event, req))
      const params = { repositoryID: req.body.pull_request.base.repo.id, htmlURL: req.body.pull_request.html_url }
      trigger.buildOnPullRequest(params, triggered, finished)
    } else if (shouldBuild.onIssueComment(event, req.body)) {
      logger.info(buildLogMessage(event, req))
      const params = { repositoryID: req.body.repository.id, htmlURL: req.body.issue.pull_request.html_url }
      trigger.buildOnIssueComment(params, triggered, finished)
    } else if (shouldBuild.onRetry(event, req.body)) {
      logger.info(buildLogMessage(event, req))
      const params = { repositoryID: req.body.pull_request.base.repo.id, htmlURL: req.body.pull_request.html_url, buildNumber: Number(req.body.build_number) }
      trigger.buildOnRetry(params, triggered, finished)
    } else {
      logger.info(buildLogMessage(event, req))
      res.sendStatus(204)
    }
  })
  return router
}
