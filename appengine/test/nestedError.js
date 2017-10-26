"use strict"

const assert = require("assert")

const nestedError = require("../lib/nestedError")

describe("nestedError", () => {
  it("causeError のメッセージがコピーされる", () => {

    const causeError = new Error("cause error")

    const e = nestedError(causeError, "(´･‿･｀)")

    assert.strictEqual(e.message, "(´･‿･｀)")
    assert.strictEqual(e.cause.message, "cause error")
  })

  it("causeError の特定のプロパティがコピーされる", () => {

    const causeError = new Error("cause error")
    causeError.code = 404
    causeError.status = "Not Found"
    causeError.UnknownHogehoge = "X"

    const e = nestedError(causeError, "(>︿<｡)")

    assert.strictEqual(e.message, "(>︿<｡)")
    assert.strictEqual(e.cause.message, "cause error")
    assert.strictEqual(e.cause.code, 404)
    assert.strictEqual(e.cause.status, "Not Found")
    assert(e.cause.UnknownHogehoge === undefined)

  })
})

