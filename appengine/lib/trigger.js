"use strict"
const logging = require("./logging")
const GitHubApi = require("github")
const github = new GitHubApi({ debug: false })
const promisify = require("es6-promisify")
const firebase = require("firebase")
const firebaseManager = require("./firebase_manager")

const assertParams = (params) => {
  return params.repositoryID && params.htmlURL
}

const parseURL = (url) => {
  const matcher = url.match(/https:\/\/github.com\/(.+)\/(.+)\/pull\/(\d+)/)
  const owner = matcher[1]
  const name = matcher[2]
  const pullRequestNumber = matcher[3]
  return { owner, name, pullRequestNumber }
}

const initLogger = (pullRequestInfo, buildNumber) => {
  const labels = {
    "repository_owner": pullRequestInfo.owner,
    "repository_name": pullRequestInfo.name,
    "pull_request_number": pullRequestInfo.pullRequestNumber
  }
  if (buildNumber) {
    labels.build_number = String(buildNumber)
  }
  return logging("hooks", {
    "type": "gae_app",
    "labels": labels
  })
}

const authGithub = (user) => Promise.resolve(
  github.authenticate({
    type: "oauth",
    token: user.access_token
  })
)

const fetchPullRequest = (logger, name, owner, pullRequestNumber) => {
  logger.info(`github から ${owner}/${name}/pull/${pullRequestNumber} を取得します`)
  return promisify(github.pullRequests.get)({
    user: owner,
    repo: name,
    number: pullRequestNumber
  })
}

const updateGithubStatusAsPending = (logger, buildNumber, pullRequest) => {
  logger.info(`github の ${pullRequest.base.repo.owner.login}/${pullRequest.base.repo.name}/tree/${pullRequest.head.sha} の status を pending に変更します`)
  return promisify(github.repos.createStatus)({
    user: pullRequest.base.repo.owner.login,
    repo: pullRequest.base.repo.name,
    sha: pullRequest.head.sha,
    state: "pending",
    target_url: `https://rocket-ci.com/@${pullRequest.base.repo.owner.login}/${pullRequest.base.repo.name}/${buildNumber}`,
    "description": "start building on rocket",
    "context": "rocket-ci"
  })
}

const updateGithubStatusAsError = (logger, buildNumber, pullRequest) => {
  logger.info(`github の ${pullRequest.base.repo.owner.login}/${pullRequest.base.repo.name}/tree/${pullRequest.head.sha} の status を error とします`)
  return promisify(github.repos.createStatus)({
    user: pullRequest.base.repo.owner.login,
    repo: pullRequest.base.repo.name,
    sha: pullRequest.head.sha,
    state: "error",
    target_url: `https://rocket-ci.com/@${pullRequest.base.repo.owner.login}/${pullRequest.base.repo.name}/${buildNumber}`,
    "description": "quotas error. please 'retest this please'",
    "context": "rocket-ci"
  })
}

const fetchAuthUser = (logger, repositoryID) => {
  logger.info(`firebase から repositories/${repositoryID} のリポジトリ情報を取得します`)
  return firebase.database().ref(`repositories/${repositoryID}`).once("value")
    .then(snap => {
      const repository = snap.val()
      logger.info(`firebase から users/${repository.token_auth_id} のユーザー情報を取得します`)
      return firebase.database().ref(`users/${repository.token_auth_id}`).once("value")
    })
    .then(snap => {
      return Promise.resolve(snap.val())
    })
}

const incrementBuildNumber = (logger, repositoryID) => {
  logger.info("ビルド番号をインクリメントします。")
  return promisify(firebaseManager.incrementBuildNumber)(repositoryID)
}

const insertNewArtifact = (logger, buildNumber, pullRequest, repositoryID) => {
  logger.info(`firebase の artifacts/${repositoryID}/${buildNumber} の成果物情報を作ります`)
  return firebase.database().ref(`artifacts/${repositoryID}/${buildNumber}`).update({
    "build_status": "pending",
    "machine_status": "booting",
    "html_url": pullRequest.html_url,
    "pull_request_number": pullRequest.number,
    "hash": pullRequest.head.sha,
    "started_at": firebase.database.ServerValue.TIMESTAMP
  }).then(() => Promise.resolve()).catch(e => Promise.reject(e))
}

const updateArtifactAsError = (logger, buildNumber, repositoryID) => {
  logger.info(`firebase の artifacts/${repositoryID}/${buildNumber} を error とします`)
  return firebase.database().ref(`artifacts/${repositoryID}/${buildNumber}`).update({
    "build_status": "error",
    "machine_status": "finished",
    "finished_at": firebase.database.ServerValue.TIMESTAMP
  }).then(() => Promise.resolve()).catch(e => Promise.reject(e))
}

module.exports = function(compute) {
  const gceManager = require("./gce_manager")(compute)

  const findAvailableRegion = (logger) => {
    logger.info("利用可能な region を探します。")
    return promisify(gceManager.findAvailableRegion)()
  }

  const launchBuildMachine = (logger, buildNumber, pullRequest, region, repositoryID) => {
    logger.info(`利用可能な region ${region.name} がありました。仮想マシンを起動します`)
    const machineName = `builder-at-${require("node-uuid").v4()}`.substring(0, 62)
    return promisify(gceManager.launchBuildMachine)(repositoryID, pullRequest.html_url, buildNumber, region, machineName)
  }

  const triggerBuild = (logger, repositoryID, buildNumber, pullRequest) => {
    return Promise.resolve()
      .then(() => {
        return Promise.all([
          insertNewArtifact(logger, buildNumber, pullRequest, repositoryID),
          updateGithubStatusAsPending(logger, buildNumber, pullRequest)
        ])
      })
      .then(() => findAvailableRegion(logger))
      .then(region => {
        return region ? launchBuildMachine(logger, buildNumber, pullRequest, region, repositoryID) : Promise.reject(new Error("利用可能な region が見つかりませんでした"))
      })
  }

  const buildOnPullRequest = (params, triggered, finished) => {
    if (!assertParams(params)) {
      const error = new Error(`パラメータが不正です。 params.repositoryID: ${params.repositoryID}, params.htmlURL: ${params.htmlURL}`)
      triggered(error)
      setImmediate(() => {
        finished(error)
      })
      return
    }

    const repositoryID = params.repositoryID
    const htmlURL = params.htmlURL
    const pullRequestInfo = parseURL(htmlURL)
    let logger = initLogger(pullRequestInfo)

    const name = pullRequestInfo.name
    const owner = pullRequestInfo.owner
    const pullRequestNumber = pullRequestInfo.pullRequestNumber

    const that = {}
    Promise.resolve()
      .then(() => fetchAuthUser(logger, repositoryID))
      .then(authGithub)
      .then(() => {
        return Promise.all([
          fetchPullRequest(logger, name, owner, pullRequestNumber),
          incrementBuildNumber(logger, repositoryID)
        ])
      })
      .catch(error => {
        triggered(error)
        return Promise.reject(error)
      })
      .then(res => {
        const pullRequest = res[0]
        const buildNumber = res[1]
        logger = initLogger(pullRequestInfo, buildNumber)
        that.pullRequest = pullRequest
        that.buildNumber = buildNumber

        triggered(null, { build_number: buildNumber })

        return triggerBuild(logger, repositoryID, buildNumber, pullRequest)
      })
      .then(res => {
        if (res.vm) {
          logger.info(`仮想マシン ${res.vm.name} を起動しました`)
        }
        finished(null, res)
      })
      .catch(e => {
        logger.error({
          "message": "処理中にエラーが発生したのでビルドを中断します",
          "error": `${e.name} : ${e.message}`,
        })

        if (that.pullRequest && that.buildNumber) {
          Promise.all([
            updateArtifactAsError(logger, that.buildNumber, repositoryID),
            updateGithubStatusAsError(logger, that.buildNumber, that.pullRequest)
          ])
            .then(() => {
              finished(e)
            })
            .catch((e) => {
              logger.error({
                "message": "ビルド中断中にエラーが発生しました",
                "error": `${e.name} : ${e.message}`
              })
              finished(e)
            })
        } else {
          finished(e)
        }
      })
  }

  const buildOnIssueComment = (params, triggered, finished) => {
    buildOnPullRequest(params, triggered, finished)
  }

  const buildOnRetry = (params, triggered, finished) => {
    if (!assertParams(params) || !Number.isInteger(params.buildNumber)) {

      const error = new Error(`パラメータが不正です。 params.repositoryID: ${params.repositoryID}, params.htmlURL: ${params.htmlURL}, params.buildNumber: ${params.buildNumber}`)

      triggered(error)
      setImmediate(() => {
        finished(error)
      })
      return
    }

    const repositoryID = params.repositoryID
    const htmlURL = params.htmlURL
    const pullRequestInfo = parseURL(htmlURL)
    const buildNumber = params.buildNumber
    const logger = initLogger(pullRequestInfo, buildNumber)

    const name = pullRequestInfo.name
    const owner = pullRequestInfo.owner
    const pullRequestNumber = pullRequestInfo.pullRequestNumber

    const that = {}
    Promise.resolve()
      .then(() => fetchAuthUser(logger, repositoryID))
      .then(authGithub)
      .then(() => fetchPullRequest(logger, name, owner, pullRequestNumber))
      .catch(error => {
        triggered(error)
        return Promise.reject(error)
      })
      .then(pullRequest => {
        that.pullRequest = pullRequest

        triggered(null, { build_number: buildNumber })

        return triggerBuild(logger, repositoryID, buildNumber, pullRequest)
      })
      .then(res => {
        if (res.vm) {
          logger.info(`仮想マシン ${res.vm.name} を起動しました`)
        }
        finished(null, res)
      })
      .catch(e => {
        logger.error({
          "message": "処理中にエラーが発生したのでビルドを中断します",
          "error": `${e.name} : ${e.message}`
        })

        if (that.pullRequest && buildNumber) {
          Promise.all([
            updateArtifactAsError(logger, buildNumber, repositoryID),
            updateGithubStatusAsError(logger, buildNumber, that.pullRequest)
          ])
            .then(() => {
              finished(e)
            })
            .catch(e => {
              logger.error({
                "message": "ビルド中断中にエラーが発生しました",
                "error": `${e.name} : ${e.message}`
              })
              finished(e)
            })
        } else {
          finished(e)
        }
      })
  }

  return {
    buildOnPullRequest,
    buildOnIssueComment,
    buildOnRetry
  }
}
