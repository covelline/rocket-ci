"use strict"

const { setupDatabase } = require("./helpers/db")

// Setup
const app = require("express")()
app.set("trust proxy", true)

// Config
const db = require("knex")({
  debug: true,
  dialect: "sqlite3",
  connection: {
    filename: "./test.db"
  }
})

setupDatabase(db)
  .then(() => {
    console.log("success database setup")
  })
  .catch(e => {
    console.error(e.message)
  })

// Routing
app.get("/", (req, res) => {
  res.status(200).send("Hello, world!")
})

// Start the server
const port = process.env.PORT || 8080
const server = app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})

module.exports = {
  server,
  app
}
