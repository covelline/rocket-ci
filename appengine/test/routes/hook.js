"use strict"

const proxyquire = require("proxyquire")
const request = require("supertest")
const crypto = require("crypto")
const express = require("express")
const compute = require("../mock/compute_error")

process.env.GITHUB_SIGNATURE = "xxx"

describe("hook", () => {
  describe("/", () => {
    it("ping に対して 204 No Content が得られること", done => {
      const payload = { payload: "this is ping" }
      const body = JSON.stringify(payload)
      const router = proxyquire("../../routes/hook", {
        "../lib/logging" : require("../mock/logging")
      })(compute)

      const hmac = crypto.createHmac("sha1", process.env.GITHUB_SIGNATURE)
      hmac.update(body, "utf-8")
      const signature = `sha1=${hmac.digest("hex")}`

      const app = express()
      app.use(router)

      request(app)
        .post("/")
        .set("X-Github-Event", "ping")
        .set("X-Hub-Signature", signature)
        .set("X-GitHub-Delivery", "test")
        .set("Content-Type", "application/json")
        .send(payload)
        .expect(204)
        .end((err) => {
          if (err) {
            throw err
          }
          done()
        })
    })
  })
})
