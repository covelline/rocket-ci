const favicons = require("favicons")
const fs = require("fs")

favicons("src/images/icon.svg", {
  background: "#fff",
  logging: true,
  online: false,
  icons: {
    appleIcon: true,
    appleStartup: false,
    windows: false,
    firefox: false,
    coast: false,
    yandex: false,
    android: false,
    favicons: true,
  }
}, (err, res) => {
  if (err) {
    console.error(err.message)
  }
  if (res) {
    res.images.forEach(file => {
      console.log(`writing ${file.name}`)
      fs.writeFileSync(`public/${file.name}`, file.contents)
    })
    console.log(res.html)
  }
})
