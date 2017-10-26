"use strict"

const proxyquire = require("proxyquire")
const request = require("supertest")

const express = require("express")

const successCompute = {
  getVMs: (options, callback) => {
    setImmediate(() => {
      callback(null, [
        {
          name: "1",
          zone: {id: "zone_1"},
          delete: (callback) => {
            setImmediate(callback)
          }
        },
        {
          name: "2",
          zone: {id: "zone_2"},
          delete: (callback) => {
            setImmediate(callback)
          }
        }
      ])
    })
  },
  zone: (zone) => ({
    vm: (name) => ({
      delete: (callback) => {
        setImmediate(callback)
      }
    })
  })
}

const errorCompute = {
  zone: (zone) => ({
    vm: (name) => ({
      delete: (callback) => {
        setImmediate(() => {
          callback(new Error())
        })
      }
    })
  })
}

describe("vm", () => {

  describe("DELETE :zone/:name", () => {

    it("削除成功", done => {

      const router = proxyquire("../../routes/vm", {
        "../lib/logging" : require("../mock/logging")
      })(successCompute)

      const app = express()
      app.use(router)

      request(app)
        .delete("/zone-name/instance-name")
        .expect(200)
        .end(done)
    })

    it("削除失敗", done => {

      const router = proxyquire("../../routes/vm", {
        "../lib/logging" : require("../mock/logging")
      })(errorCompute)

      const app = express()
      app.use(router)

      request(app)
        .delete("/zone-name/instance-name")
        .expect(500)
        .end(done)
    })
  })

  describe("GET  all/delete", () => {
    it("削除成功", done => {

      const router = proxyquire("../../routes/vm", {
        "../lib/logging" : require("../mock/logging")
      })(successCompute)

      const app = express()
      app.use(router)

      request(app)
        .get("/delete-all")
        .expect(200)
        .end(done)
    })

    it("削除失敗 (vm 一覧の取得に失敗)", done => {
      const errorCompute = {
        getVMs: (options, callback) => {
          setImmediate(() => {
            callback(new Error())
          })
        }
      }

      const router = proxyquire("../../routes/vm", {
        "../lib/logging" : require("../mock/logging")
      })(errorCompute)

      const app = express()
      app.use(router)

      request(app)
        .get("/delete-all")
        .expect(500)
        .end(done)
    })

    it("削除失敗 (vm の削除に失敗)", done => {

      const errorCompute = {
        getVMs: (options, callback) => {
          setImmediate(() => {
            callback(null, [
              {
                name: "1",
                zone: {id: "zone_1"},
                delete: (callback) => {
                  setImmediate(() => {
                    callback(new Error("(o´_`o)"))
                  })
                }
              },
              {
                name: "2",
                zone: {id: "zone_2"},
                delete: (callback) => {
                  setImmediate(callback)
                }
              }
            ])
          })
        }
      }

      const router = proxyquire("../../routes/vm", {
        "../lib/logging" : require("../mock/logging")
      })(errorCompute)

      const app = express()
      app.use(router)

      request(app)
        .get("/delete-all")
        .expect(500)
        .end(done)

    })
  })
})
