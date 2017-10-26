/*jslint es6 */
const assertOpt = require("./assert-opt")

function buildNumberRef(firebase, repo_id) {
  return firebase
    .database()
    .ref("repositories")
    .child(`${repo_id}/last_build_number`)
}

module.exports.exec = function(options) {

  assertOpt(options, "repo_id", "number")
  assertOpt(options, "key_file_path", "string")

  const firebase = require("./umbilical")(options.key_file_path)

  const repo_id = options.repo_id

  const increment = !!options.increment

  if (increment) {

    buildNumberRef(firebase, repo_id).transaction( currentData => {

      if (currentData === null) {
        return 1
      } else {
        if (typeof currentData === "number") {
          return currentData + 1
        } else {
          return null
        }
      }
    }, (error,  committed,  snapshot) => {
      if (error) {
        process.stderr.write(error + "\n")
        process.exit(2)
      } else {
        process.stdout.write(snapshot.val() + "\n")
        process.exit(0)
      }
    })

  } else {

    buildNumberRef(firebase, repo_id).once("value", snap => {
      if (snap.exists()) {
        const num = parseInt(snap.val())
        process.stdout.write(num)
        process.exit(0)
      } else {
        process.exit(2)
      }
    })
  }
}
