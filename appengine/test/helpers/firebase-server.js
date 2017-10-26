const FirebaseServer = require("firebase-server")
const firebase = require("firebase")

/**
  firebase の初期化、削除忘れを防ぐために
  firebase-server と firebase を同時に初期化、削除する
 */
module.exports = function(port, name, data) {
  const dbServer = new FirebaseServer(port, "localhost:5000", data)
  firebase.initializeApp({
    databaseURL: `ws://127.0.1:${port}`
  })

  return {
    close: () => {
      return Promise.all([
        firebase.app().delete(),
        dbServer.close()
      ])
    }
  }
}
