/*jslint es6 */
const assertOpt = require("./assert-opt")

function dataRef(firebase, path) {
  return firebase
    .database()
    .ref(path)
}

module.exports.exec = function(options) {
  assertOpt(options, "path", "string")
  assertOpt(options, "key_file_path", "string")

  const firebase = require("./umbilical")(options.key_file_path)
  const path = options.path
  const showOnly = !options.data

  if(showOnly) {
    dataRef(firebase, path).once("value", snap => {
      process.stdout.write(JSON.stringify(snap.val()) + "\n")
      process.exit(0)
    }, err => {
      process.stderr.write(err + "\n")
      process.exit(1)
    })
  } else {
    assertOpt(options, "data", "object")
    const data = options.data
    dataRef(firebase, path).update(data, err => {
      if (err) {
        process.stderr.write(err + "\n")
        process.exit(2)
      } else {
        process.exit(0)
      }
    })
  }
}

module.exports.push = function(options) {
  assertOpt(options, "path", "string")
  assertOpt(options, "key_file_path", "string")
  assertOpt(options, "data", "string")

  const firebase = require("./umbilical")(options.key_file_path)
  const path = options.path
  let data
  try {
    // パラメータに json が渡されたときはパースをする
    data = JSON.parse(options.data)
  } catch (e) {
    // json のパースができないときは文字列として扱う
    data = options.data
  }
  const pushedRef = dataRef(firebase, path).push()
  pushedRef.set(data, (err) => {
    if (err) {
      process.stderr.write(err + "\n")
      process.exit(2)
    } else {
      process.stdout.write(pushedRef.key + "\n")
      process.exit(0)
    }
  })
}
