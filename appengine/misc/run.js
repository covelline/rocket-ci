"use strict:";
/* eslint-disable no-console */
process.env.GITHUB_SIGNATURE = "xxx"
const request = require("supertest")
const crypto = require("crypto")

console.log("ログを http://goo.gl/PHuITT で確認できます")
const payload = require("../test/json/pull_request_event.json")
const body = JSON.stringify(payload)
const app = require("../app.js")
const hmac = crypto.createHmac("sha1", process.env.GITHUB_SIGNATURE)
hmac.update(body, "utf-8")
const signature = `sha1=${hmac.digest("hex")}`
request(app.app)
  .post("/")
  .set("X-Github-Event", "pull_request")
  .set("X-Hub-Signature", signature)
  .set("X-GitHub-Delivery", "test")
  .set("Content-Type", "application/json")
  .send(payload)
  .end((err, res) => {
    if (err) {
      console.error(err);
    }
    if (res) {
      console.log(res.status);
    }
  })
