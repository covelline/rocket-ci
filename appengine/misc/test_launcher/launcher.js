/* eslint-disable no-console */
"use strict"
/*
    repo_id: リポジトリ ID
    action: "アクション"
    full_name: "owner/repo_name"
    number: Pull request number
 */

if (process.argv.length < 3) {
  console.log("dataset のファイル名を指定してください")
  console.log("node launch_request.js ./path_to_dataset.json")
  process.exit(1)
}

const datasetFilepath = process.argv[2]
const dataset = require(datasetFilepath)

const request = require("request")
const crypto = require("crypto")
const async = require("async")

const URL = process.env.TEST_URL || "http://localhost"
const PORT = process.env.TEST_PORT || "8080"
const SIGNATURE = process.env.GITHUB_SIGNATURE || "ABCD"

console.log(`
以下の環境でテストを始めます.
  - URL: ${URL}:${PORT}
  - GITHUB_SIGNATURE: ${SIGNATURE}
  - dataset: ${dataset}
  `)

const url = `${URL}:${PORT}`

function requestTrigger(param, callback) {
  const action = param.action
  const repo_id = param.repo_id
  const full_name = param.full_name
  const number = param.number
  const event = param.event

  if (typeof action !== "string") {
    callback(new Error("action は string で指定します"))
    return
  }
  if (typeof repo_id !== "number") {
    callback(new Error("repo_id は number で指定します"))
    return
  }
  if (typeof full_name !== "string") {
    callback(new Error("full_name は string で指定します"))
    return
  }
  if (typeof number !== "number") {
    callback(new Error("number は number で指定します"))
    return
  }
  if (typeof event !== "string") {
    callback(new Error("event は string で指定します"))
    return
  }

  const body = {
    action,
    pull_request: {
      html_url: `https://github.com/${full_name}/pull/${number}`,
      base: {
        repo: {
          id: repo_id
        }
      }
    }
  }

  // issue_comment の場合はオブジェクトの構造を変える
  if (event === "issue_comment") {
    body.issue = {}
    body.issue.pull_request = body.pull_request
    body.pull_request = null

    body.comment = {}
    body.comment.body = param.comment
    body.repository = { id: repo_id }
  }

  // retry の場合は build_number を付ける
  if (event === "retry") {
    body.build_number = param.build_number
  }

  const hmac = crypto.createHmac("sha1", SIGNATURE)
  hmac.update(JSON.stringify(body), "utf-8")

  const headers = {
    "X-GitHub-Delivery": "test-b33ab300-9054-11e6-83f0-cf4d3ca2f57f",
    "X-GitHub-Event": event,
    "X-Hub-Signature": `sha1=${hmac.digest("hex")}`
  }

  const options = {
    url,
    headers,
    body,
    json: true
  }

  request.post(options, callback)
}

function postMessage(attachments, callback = () => { }) {
  if (!process.env.SLACK_BOT_TOKEN) {
    setImmediate(() => {
      callback()
    })
    return
  }

  request.post("https://slack.com/api/chat.postMessage",
    {
      form: {
        token: process.env.SLACK_BOT_TOKEN,
        channel: "rocket-ci-ci",
        as_user: true,
        attachments: JSON.stringify(attachments)
      }
    }
    , (error, response, body) => {
      callback(error, response, body)
    }
  )
}

async.mapSeries(dataset, (data, callback) => {

  console.log(data.description)
  console.log(">", `${data.full_name}: action => ${data.action} pr_num => ${data.number} のビルドを開始します`)
  requestTrigger(data, (error, resp, body) => {

    const result = Object.assign(data, body)

    if (error) {
      console.error("> 起動に失敗しました", error)
    } else if (resp.statusCode < 200 || resp.statusCode >= 300) {
      console.log(`> Invalid status code: ${resp.statusCode}`)
      error = new Error(`Invalid status code: ${resp.statusCode}`)
    } else {
      const gh_url = `https://github.com/${data.full_name}/pull/${data.number}`
      const rocket_url = `https://rocket-ci.com/@${data.full_name}/${body.build_number}`
      console.log(">", "起動に成功しました。 以下の 2つのページで結果をチェックしてください。")
      console.log(">", `GitHub: ${gh_url}`)
      console.log(">", `Rocket: ${rocket_url}`)

      result.gh_url = gh_url
      result.rocket_url = rocket_url
    }
    callback(error, result)
  })
}, (error, results) => {

  if (error) {
    const attachments = [{
      title: "インスタンスの起動に失敗しました",
      text: error.message,
      color: "danger"
    }]
  } else {
    // TODO: slack じゃなくて checkbox 付きの issue を作るようにする
    const attachments = results.map(r => {
      return {
        title: r.description,
        color: "good",
        text: `${r.full_name}: action => ${r.action} pr_num => ${r.number} build_number => ${r.build_number} のビルドが実行されました`,
        fields: [
          {
            title: "GitHub でビルド結果を確認してください",
            value: r.gh_url,
            short: false
          },
          {
            title: "Rocket でビルド結果を確認してください",
            value: r.rocket_url,
            short: false
          }
        ]
      }
    })
  }
})
