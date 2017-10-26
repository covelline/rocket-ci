"use strict"

// Setup
const app = require("express")()
const cors = require("cors")

// Configurations
require("firebase").initializeApp({
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  serviceAccount: process.env.FIREBASE_SERVICE_ACCOUNT_PATH
})
const compute = require("google-cloud").compute({
  projectId: "rocket-ci",
  keyFilename: process.env.FIREBASE_SERVICE_ACCOUNT_PATH
})

// Routing
app.set('trust proxy', true)
app.use("/", require("./routes/hook")(compute))
app.options("/setup", cors())
app.use("/", require("./routes/setup"))
app.use("/vm", require("./routes/vm")(compute))
app.use("/repositories", require("./routes/repository"))

// Start the server
var server = app.listen(process.env.PORT || "8080")

module.exports = {
  server,
  app
}
