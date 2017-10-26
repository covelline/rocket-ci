"use strict"

const assert = require("assert")

module.exports = function(obj, key, type) {

  const val = obj[key]

  assert(val && ((typeof val) === type),
    `Required option "${key}" must be "${type}". actually type of "${typeof val}" and value of "${val}"`)
}
