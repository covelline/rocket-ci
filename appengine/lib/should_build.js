"use strict"

module.exports.onPullRequest = (event, body) => {
  if (event != "pull_request") {
    return false
  }
  const action = body.action
  return action === "opened" || action === "reopened" || action === "synchronize"
}

module.exports.onIssueComment = (event, body) => {
  if (event != "issue_comment") {
    return false
  }
  if (!body.issue.pull_request) {
    return false
  }
  const action = body.action
  if (!(action === "created" || action === "edited")) {
    return false
  }
  const comment = body.comment.body
  const matcher = /^retest this please/i
  return comment.match(matcher) !== null
}

module.exports.onRetry = (event, body) => event == "retry" && body.pull_request != null
