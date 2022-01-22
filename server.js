const { createServer } = require("https")
const { readFileSync } = require("fs")

const express = require("express")
const { createRequestHandler } = require("@remix-run/express")

const app = express()

app.use(express.static("public"))

app.all("*", createRequestHandler({
    build: require("./build"),
    getLoadContext() {}
}))

const port = process.env.PORT || 3000

createServer({
    key: readFileSync(process.env.SSL_KEY),
    cert: readFileSync(process.env.SSL_CERT),
    passphrase: process.env.SSL_PASSPHRASE
}, app).listen(port, () => {
    console.log(`Running on port ${port}.`)
})