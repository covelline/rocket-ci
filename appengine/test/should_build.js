"use strict:";
/* eslint-disable no-console */
const assert = require("assert")
const shouldBuild = require("../lib/should_build")
describe("shouldBuild", () => {
  describe("onPullrequest", () => {
    const event = "pull_request"
    it("アクションが opened のとき true となる", () => {
      const body = { action: "opened" }
      assert.strictEqual(shouldBuild.onPullRequest(event, body), true)
    })
    it("アクションが closed のとき false となる", () => {
      const body = { action: "closed" }
      assert.strictEqual(shouldBuild.onPullRequest(event, body), false)
    })
  })
  describe("onIssueComment", () => {
    const event = "issue_comment"
    it("pull request に対するコメントではないとき false となる", () => {
      const body = { issue: {} }
      assert.strictEqual(shouldBuild.onIssueComment(event, body), false)
    })
    it("アクションが deleted のとき false となる", () => {
      const body = {
        issue: {
          pull_request: {}
        },
        action: "deleted"
      }
      assert.strictEqual(shouldBuild.onIssueComment(event, body), false)
    })
    it("書き込まれたコメントが hello this is comment のとき false となる", () => {
      const body = {
        issue: {
          pull_request: {}
        },
        action: "created",
        comment: { body: "hello this is comment" }
      }
      assert.strictEqual(shouldBuild.onIssueComment(event, body), false)
    })
    it("書き込まれたコメントが retest this please のとき true となる", () => {
      const body = {
        issue: {
          pull_request: {}
        },
        action: "created",
        comment: { body: "retest this please" }
      }
      assert.strictEqual(shouldBuild.onIssueComment(event, body), true)
    })
  })
  describe("onRetry", () => {
    const event = "retry"
    it("pull request が含まれないとき false となる", () => {
      const body = {}
      assert.strictEqual(shouldBuild.onRetry(event, body), false)
    })
    it("pull request が含まれているとき true となる", () => {
      const body = { pull_request: {} }
      assert.strictEqual(shouldBuild.onRetry(event, body), true)
    })
  })
})
