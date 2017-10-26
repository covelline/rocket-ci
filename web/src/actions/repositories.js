import _ from "lodash"
import firebase from "firebase"
import { fetchUser, fetchGithub } from "./user"
import { leaveRepo, setupRepo } from "../helpers/network.js"

/// github api のデータ
export const SET_REPOS = "SET_REPOS"
export const SET_SELECTED_REPO = "SET_SELECTED_REPO"

/// firebase のデータ
export const UPDATE_FIREBASE_REPO = "UPDATE_FIREBASE_REPO"
export const SET_FIREBASE_REPO_REFERENCES = "SET_FIREBASE_REPO_REFERENCES"

export function updateFirebaseRepo(repo) {
  return {
    type: UPDATE_FIREBASE_REPO,
    repo
  }
}

export function setFirebaseRepoReferences(refs) {
  return {
    type: SET_FIREBASE_REPO_REFERENCES,
    refs
  }
}


export function setRepos(repos) {
  return {
    type: SET_REPOS,
    repos
  }
}

/* Async Action Creators */

// repoId の repositories を on("value") する.
//
// 使用後は unsubscribeFirebaseRepo(repoId) で解除する.
export const subscribeFirebaseRepo = (repoId) => (dispatch, getState) => {

  const refs = getState().firebaseRepositoryReferences
  if (refs[repoId]) {
    // 既に subscribe していたら何もしない
    return
  }

  const ref = firebase.database().ref("repositories").child(repoId)
  const nextRefs = Object.assign(refs, {[repoId]: ref})

  dispatch(setFirebaseRepoReferences(nextRefs))

  // 別のリポジトリの環境変数が一瞬見えてしまう問題の対策
  dispatch(updateFirebaseRepo(null))

  ref.on("value", snap => {
    dispatch(updateFirebaseRepo(snap.val()))
  })
}

export const unsubscribeFirebaseRepo = (repoId) => (dispatch, getState) => {

  const refs = getState().firebaseRepositoryReferences
  const ref = refs[repoId]
  if (!ref) {
    return
  }

  ref.off()
  const nextRefs = _.omit(refs, repoId)
  dispatch(setFirebaseRepoReferences(nextRefs))
}

export const fetchRepos = () => (dispatch, getState) => {
  return dispatch(fetchGithub())
    .then(github => github.getUser().listRepos())
    .then(result => {
      dispatch(setRepos(result.data))
    })
}

/**
  特定のリポジトリの取得
  orgName, repoName は "covelline", "feather" のようになる
  repos は全てのリポジトリ redux の repositories に入っているので、できれば渡す
 */
export const fetchRepoByName = (github, orgName, repoName, repos = []) => {
  const fullname = `${orgName}/${repoName}`

  const repo = _.find(repos, r => r.full_name === fullname)
  if (repo) {
    // リポジトリ一覧に含まれていたらそれを使う
    return Promise.resolve(repo)
  }

  return github.getRepo(orgName, repoName).getDetails()
    .then(result => Promise.resolve(result.data))
}

export const leaveRepoAction = (repo) => (dispatch, getState) => {
  return dispatch(fetchGithub())
    .then(github => leaveRepo(getState().authorizedUser.uid, github, repo))
    .then(() => dispatch(fetchUser())) // 設定済みのリポジトリ一覧を更新する
}

export const setupRepoAction = (repo) => (dispatch, getState) => {
  return setupRepo(getState().authorizedUser.uid, getState().user, repo)
    .then(() => dispatch(fetchUser())) // 設定済みのリポジトリ一覧を更新する
}
