"use strict";

/* eslint-disable no-console */
const proxyquire = require("proxyquire");
const assert = require("assert");

describe("trigger", () => {
  describe("event: retry", () => {
    const body = { repositoryID: 35404927, htmlURL: "https://github.com/covelline/feather-for-android/pull/892", buildNumber: 1 }

    it("イベントが処理されて VM が起動する", done => {

      const trigger = proxyquire("../lib/trigger", {
        "./gce_manager": require("./mock/gce_manager"),
        "./firebase_manager": require("./mock/firebase_manager_for_retry"),
        "firebase": require("./mock/firebase"),
        "./logging" : require("./mock/logging"),
        "github": require("./mock/github")
      })()
      trigger.buildOnRetry(body, (e, result) => {
        assert.strictEqual(e, null)
        assert.deepStrictEqual(result, { build_number: 1 })
      }, (e, res) => {
        assert.strictEqual(e, null)
        assert.strictEqual(res.vm.name, "launched")
        done()
      })
    })

    it("firebase から取得失敗", done => {

      const trigger = proxyquire("../lib/trigger", {
        "./gce_manager": require("./mock/gce_manager"),
        "./logging" : require("./mock/logging"),
        "github": require("./mock/github"),
        "firebase": {
          database: () => ({
            ref: () => ({
              once: () => Promise.reject(new Error("(o´_`o)"))
            })
          })
        }
      })()

      trigger.buildOnRetry(body, e => {
        assert.ok(e)
        assert.strictEqual(e.message, "(o´_`o)")
      }, (e, res) => {
        assert.ok(e)
        assert.ifError(res)
        assert.strictEqual(e.message, "(o´_`o)")
        done()
      })

    })

    it("不正なパラメータ", done => {

      const body = {}

      const trigger = proxyquire("../lib/trigger", {
        "./gce_manager": require("./mock/gce_manager"),
        "./firebase_manager": require("./mock/firebase_manager_for_retry"),
        "firebase": require("./mock/firebase"),
        "./logging" : require("./mock/logging"),
        "github": require("./mock/github")
      })()
      trigger.buildOnRetry(body, (e, result) => {
        assert.ifError(result)
        assert.ok(e)
      }, (e, res) => {
        assert.ifError(res)
        assert.ok(e)
        done()
      })
    })

    it("CPU が足りないときには VM が起動しない", done => {
      const trigger = proxyquire("../lib/trigger", {
        "./gce_manager": require("./mock/gce_manager_disable_region"),
        "./firebase_manager": require("./mock/firebase_manager"),
        "firebase": require("./mock/firebase"),
        "./logging" : require("./mock/logging"),
        "github": require("./mock/github")
      })()
      trigger.buildOnRetry(body,(e, result) => {
        assert.strictEqual(e, null)
        assert.deepStrictEqual(result, { build_number: 1 })
      }, (e, res) => {
        assert.strictEqual(e.message, "利用可能な region が見つかりませんでした")
        assert.strictEqual(res, undefined)
        done()
      })
    })

  })

  describe("event: pull_request", () => {
    const body = { repositoryID: 35404927, htmlURL: "https://github.com/covelline/feather-for-android/pull/892" }
    it("イベントが処理されて VM が起動する", done => {
      const trigger = proxyquire("../lib/trigger", {
        "./gce_manager": require("./mock/gce_manager"),
        "./firebase_manager": require("./mock/firebase_manager"),
        "firebase": require("./mock/firebase"),
        "./logging" : require("./mock/logging"),
        "github": require("./mock/github")
      })()
      trigger.buildOnPullRequest(body,(e, result) => {
        assert.strictEqual(e, null)
        assert.deepStrictEqual(result, { build_number: 1 })
      }, (e, res) => {
        assert.strictEqual(e, null)
        assert.strictEqual(res.vm.name, "launched")
        done()
      })
    })

    it("firebase から取得失敗", done => {
      const trigger = proxyquire("../lib/trigger", {
        "./gce_manager": require("./mock/gce_manager"),
        "./firebase_manager": require("./mock/firebase_manager"),
        "./logging" : require("./mock/logging"),
        "github": require("./mock/github"),
        "firebase": {
          database: () => ({
            ref: () => ({
              once: () => Promise.reject(new Error("(o´_`o)"))
            })
          })
        }
      })()
      trigger.buildOnPullRequest(body, e => {
        assert.strictEqual(e.message, "(o´_`o)")
      }, (e, res) => {
        assert.ifError(res)
        assert.strictEqual(e.message, "(o´_`o)")
        done()
      })
    })

    it("不正なパラメータ", done => {

      const body = {}

      const trigger = proxyquire("../lib/trigger", {
        "./gce_manager": require("./mock/gce_manager"),
        "./firebase_manager": require("./mock/firebase_manager_for_retry"),
        "firebase": require("./mock/firebase"),
        "./logging" : require("./mock/logging"),
        "github": require("./mock/github")
      })()
      trigger.buildOnPullRequest(body, (e, result) => {
        assert.ifError(result)
        assert.ok(e)
      }, (e, res) => {
        assert.ifError(res)
        assert.ok(e)
        done()
      })
    })

    it("CPU が足りないときには VM が起動しない", done => {
      const trigger = proxyquire("../lib/trigger", {
        "./gce_manager": require("./mock/gce_manager_disable_region"),
        "./firebase_manager": require("./mock/firebase_manager"),
        "firebase": require("./mock/firebase"),
        "./logging" : require("./mock/logging"),
        "github": require("./mock/github")
      })()
      trigger.buildOnPullRequest(body,(e, result) => {
        assert.strictEqual(e, null)
        assert.deepStrictEqual(result, { build_number: 1 })
      }, (e, res) => {
        assert.ifError(res)
        assert.strictEqual(e.message, "利用可能な region が見つかりませんでした")
        done()
      })
    })
  })
})
