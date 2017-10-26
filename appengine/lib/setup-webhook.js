"use strict"

const GitHubApi = require("github")

module.exports = function(token, owner, repo) {

  return new Promise((resolve, reject) => {

    if (!token) {
      reject(new Error("Invalid github token"))
      return
    }

    const github = new GitHubApi({
      protocol: "https",
      headers: {
        "user-agent": "Rocket"
      }
    })

    github.authenticate({
      type: "oauth",
      token: token
    })

    github.repos.getHooks({
      user: owner,
      repo: repo
    }, (err, hooks) => {

      if (err) {
        reject(err)
        return
      }

      const hook = hooks.find(h => {
        return h.name === "web" && h.config.url.indexOf("hooks.rocket-ci.com") !== -1
      })

      if (hook) {
        // 設定済み

        resolve(hook)

      } else {
        // 未設定なので設定する
        github.repos.createHook({
          user: owner,
          repo: repo,
          name: "web",
          config: {
            secret: process.env.GITHUB_SIGNATURE,
            url: "https://hooks.rocket-ci.com",
            content_type: "json"
          },
          events: ["pull_request", "issue_comment"],
          active: true
        }, (err, resp) => {

          if (err) {
            reject(err)
            return
          }
          resolve(resp)
        })
      }
    })
  })
}

