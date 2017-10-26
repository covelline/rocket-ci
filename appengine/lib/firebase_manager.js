"use strict"
const firebase = require("firebase")

module.exports.incrementBuildNumber = (repositoryID, callback) => {
  firebase.database()
    .ref("repositories")
    .child(`${repositoryID}/last_build_number`)
    .transaction((current) => {
      if (current === null) {
        return 1
      }
      if (typeof current === "number") {
        return current + 1
      }
      return null
    }, (error, commited, snap) => {
      if (error) {
        callback(error)
      }
      if (snap.exists()) {
        callback(null, snap.val())
      }
    })
}
