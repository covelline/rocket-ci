/**

  firebase や Github API を組み合わせた複雑な非同期処理を
  一つの Promise として提供する

*/

import firebase from "firebase"
import Github from "github-api"
import invariant from "invariant"
import warning from "warning"
import "whatwg-fetch"
import url from "url"

// 色々なところで使うのならこれは別ファイルにする.
const ROCKET_API_URL = (() => {
  if (process.env.REACT_APP_ROCKET_API_URL) {
    return process.env.REACT_APP_ROCKET_API_URL
  }
  return "https://hooks.rocket-ci.com"
})()

/**
  ログイン済みなら即座に完了し、そうでなければログイン状態を監視して
  ログイン後に一度だけ完了する Promise を返す
*/
export function onAuth() {
  if (firebase.auth().currentUser) {
    return Promise.resolve(firebase.auth().currentUser)
  }
  return new Promise((resolve, reject) => {
    const off = firebase.auth().onAuthStateChanged(user => {
      if (user) {
        off()
        resolve(user)
      }
    })
  })
}

/**
 ポップアップを表示して認証を行い、Github のユーザー情報を取得して
 firebase に格納する Promise を返す
 */
export function signInWithPopup(requestPrivateAccess = false) {
  const provider = new firebase.auth.GithubAuthProvider()
  provider.addScope("user:email")
  provider.addScope("public_repo")

  if (requestPrivateAccess) {
    provider.addScope("repo")
    provider.addScope("write:repo_hook")
  }

  let accessToken

  return firebase.auth().signInWithPopup(provider)
    .then(result => {
      const token = result.credential.accessToken
      return Promise.resolve(token)
    })
    .then(token => {
      if (requestPrivateAccess) {
        return Promise.resolve(token)
      } else {

        const uid = firebase.auth().currentUser.uid

        return firebase.database()
          .ref("users")
          .child(`${uid}/access_token`)
          .once("value")
          .then(snap => {
            // 既に存在している場合は古いのを使う
            if (snap.exists()) {
              return Promise.resolve(snap.val())
            } else {
              return Promise.resolve(token)
            }
          })
      }
    })
    .then(token => {

      accessToken = token

      if (!accessToken) {
        return Promise.reject(new Error("accesst token is null"))
      }

      return new Github({token: accessToken}).getUser().getProfile()
    })
    .then(result => {
      // DB に保存
      const uid = firebase.auth().currentUser.uid
      return firebase.database().ref("users").child(uid).update({
        access_token: accessToken,
        user_id: result.data.id,
        github_username: result.data.login
      })
    })
    .catch(error => {
      // 失敗したらユーザーを削除する
      const { currentUser } = firebase.auth()
      if (currentUser) {
        currentUser.delete()
      }
      throw error
    })
}

/*

 firebase の repositories の configured_users に
 現在のユーザーが存在すれば Github のリポジトリから hook と deploy key を削除し、
 firebase から関係する設定値を削除する

 @see https://github.com/covelline/rocket-ci.com/issues/90

*/
export function leaveRepo(uid, github, repo) {
  invariant(uid != null && github != null && repo != null, "invalid argument")

  const that = {}

  return firebase.database().ref("repositories").child(repo.id).once("value")
    .then(snap => {
      that.repository = snap.val()
      const users = snap.child("configured_users").child(uid)

      if (!users.exists()) {
        return Promise.reject(`Not found user "${uid}" at ${repo.full_name}`)
      }

      return Promise.resolve()
    })
    .then(() => {
      const repository = that.repository
      const githubRepo = github.getRepo(repo.owner.login, repo.name)

      warning(repository.hook_id, "missing hook_id")
      warning(repository.deploy_key_id, "missing deploy_key_id")

      return Promise.all([
        githubRepo.deleteHook(repository.hook_id),
        githubRepo.deleteKey(repository.deploy_key_id)
      ])
    })
    .catch(e => {
      if (e.request.method === "DELETE" && e.status === 404) {
        // hook, key が削除済みで 404 の場合は復帰する
        return Promise.resolve()
      }
      return Promise.reject(e)
    })
    .then(() => {
      // hook と deploy key も削除
      const repoPath = `repositories/${repo.id}`
      return firebase.database().ref().update({
        [`users/${uid}/configured_repositories/${repo.id}`]: null,
        [`${repoPath}/configured_users/${uid}`]: null,
        [`${repoPath}/deploy_key_id`]: null,
        [`${repoPath}/hook_id`]: null
      })
    })
}

/*
 * api で hook の設定を行う.
 *
 */
function requestSetupHook(firebaseUID, owner, repo) {
  const URL = url.resolve(ROCKET_API_URL, "/setup")

  return firebase.auth().currentUser.getToken(true)
    .then(firebaseToken =>
      fetch(URL, {
        mode: "cors",
        credentials: "same-origin",
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          owner,
          repo,
          firebaseToken
        })
      })
    )
    .then(response => {
      if (!response.ok) {
        // 500 などのエラーの場合は reject する
        return response.json().then(e => {
          throw Error(e.error)
        })
      }
      return response.json()
    })
}

/*
  WebHook を作る
*/
export function setupRepo(uid, githubUser, repo) {
  invariant(uid != null && githubUser != null && repo != null, "invalid argument")

  const owner = repo.owner.login
  const repoName = repo.name
  const repoId = repo.id

  const user = {
    user_id: githubUser.user_id,
    github_username: githubUser.github_username
  }

  return requestSetupHook(uid, owner, repoName)
    .then(hook => {
      const hook_id = hook.id
      const repoPath = `repositories/${repoId}`

      return firebase.database().ref().update({
        [`${repoPath}/artifacts_visibility`]: "private",
        [`${repoPath}/hook_id`]: hook_id,
        [`${repoPath}/token_auth_id`]: uid,
        [`${repoPath}/configured_users/${uid}`]: user,
        [`${repoPath}/repository_full_name`]: repo.full_name,
        [`users/${uid}/configured_repositories/${repoId}/configured_at`]: firebase.database.ServerValue.TIMESTAMP
      })
    })
}
