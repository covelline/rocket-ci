"use strict"

const assert = require("assert")
const FirebaseServer = require("./helpers/firebase-server")
const firebaseManager = require("../lib/firebase_manager")
const firebase = require("firebase")

describe("firebase", () => {
  describe("database", () => {
    let dbServer

    beforeEach(() => {
      dbServer = new FirebaseServer(5000, "localhost:5000", {
        users: {
          1: { name: "name_1" }
        },
        repositories: {
          100: {
            last_build_number: 1
          },
          101: {
          }
        }
      })
    })

    afterEach(() => {
      return dbServer.close()
    })

    it("fetch data", done => {
      firebase.database().ref("/").once("value")
        .then(snap => {
          assert(snap.exists())
          done()
        })
    })

    it("incrementBuildNumber: last_build_number が無い場合は 1 になる.", done => {
      firebaseManager
        .incrementBuildNumber(101, (err, val) => {
          assert.equal(val, 1)
          done()
        })
    })

    it("incrementBuildNumber: increment される.", done => {
      firebaseManager
        .incrementBuildNumber(100, (err, val) => {
          assert.equal(val, 2)
          done()
        })
    })
  })
})
