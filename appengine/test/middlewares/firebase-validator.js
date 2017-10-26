const request = require("supertest")
const express = require("express")
const FirebaseServer = require("../helpers/firebase-server")
const proxyquire = require("proxyquire")

describe("firebase-validator", () => {
  it("id token が指定されていない場合は 401 エラー", done => {
    const validator = require("../../middlewares/firebase-validator.js")
    const app = express()
    app.use("/", require("body-parser").json())
    app.use(validator)
    app.post("/", (req, res) => {
      res.sendStatus(200)
    })
    request(app)
        .post("/")
        .send()
        .expect(401, { error: "must provide firebase id token" })
      .end(done)
  })
  it("verifyIdToken に失敗した場合は 403 エラー", done => {
    const dbServer = new FirebaseServer(5000, "localhost:5000", {})
    const validator = proxyquire("../../middlewares/firebase-validator.js", {
      "firebase": {
        auth : () => ({
          verifyIdToken: () => Promise.reject(new Error("invalid firebaseToken"))
        })
      }
    })
    const app = express()
    app.use("/", require("body-parser").json())
    app.use(validator)
    app.post("/",(req, res) => {
      res.sendStatus(200)
    })
    request(app)
      .post("/")
      .send({ firebaseToken: "token" })
      .expect(403, { message: "Forbidden", cause: { message: "invalid firebaseToken" } })
      .end(e => {
        dbServer.close()
        done(e)
      })
  })
})
