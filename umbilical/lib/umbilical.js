"use strict"
/**
 * 設定済み firebase の alias.
 */
module.exports = function(path) {

  const firebase = require("firebase-admin")

  firebase.initializeApp({
    credential: firebase.credential.cert(require(path)),
    databaseURL: "https://rocket-ci.firebaseio.com"
  })

  return firebase
}
