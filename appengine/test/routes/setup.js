"use strict"

const proxyquire = require("proxyquire")
const request = require("supertest")
const express = require("express")
const FirebaseServer = require("../helpers/firebase-server")
const assert = require("assert")

process.env.GITHUB_SIGNATURE = "xxx"

describe("setup", () => {
  describe("/setup", () => {

    it("パラメータがない場合は 401: Unauthorized", done => {

      const router = proxyquire("../../routes/setup", {
        "../lib/setup-webhook": function() {
          assert(0, "Github の API が叩かれる前にレスポンスが帰るはず")
          return Promise.resolve()
        },
        "../lib/logging" : require("../mock/logging")
      })

      const app = express()
      app.use(router)

      request(app)
        .post("/setup")
        .send()
        .expect(401, {error: "must provide firebase id token"})
        .end(done)
    })

    it("github api で error が発生した場合は 500", done => {
      const dbServer = new FirebaseServer(5000, "localhost:5000", {
        users: {
          uid: {
            access_token: "1234"
          }
        }
      })

      const router = proxyquire("../../routes/setup", {
        "../lib/setup-webhook": function(token, owner, repo) {

          assert.equal(token, "1234")
          assert.equal(owner, "owner")
          assert.equal(repo, "repo")
          return Promise.reject(new Error("Github error"))
        },
        "../lib/logging" : require("../mock/logging"),
        "../middlewares/firebase-validator": require("../mock/firebase-validator")
      })

      const app = express()
      app.use(router)

      request(app)
        .post("/setup")
        .send({
          firebaseToken: "token",
          owner: "owner",
          repo: "repo"
        })
        .expect(500)
        .expect({
          message: "Internal Server Error",
          cause: {
            message: "Github error"
          }
        })
        .end(e => {
          dbServer.close()
          done(e)
        })
    })

    it("200", done => {

      const dbServer = new FirebaseServer(5000, "localhost:5000", {
        users: {
          uid: {
            access_token: "1234"
          }
        }
      })

      const router = proxyquire("../../routes/setup", {
        "../lib/setup-webhook": function(token, owner, repo) {
          assert.equal(token, "1234")
          assert.equal(owner, "owner")
          assert.equal(repo, "repo")
          return Promise.resolve({ok: "ok"})
        },
        "../lib/logging" : require("../mock/logging"),
        "../middlewares/firebase-validator": require("../mock/firebase-validator")
      })

      const app = express()
      app.use(router)

      request(app)
        .post("/setup")
        .send({
          firebaseToken: "token",
          owner: "owner",
          repo: "repo"
        })
        .expect(200, {ok: "ok"})
        .end(e=> {
          dbServer.close()
          done(e)
        })
    })
  })
})
