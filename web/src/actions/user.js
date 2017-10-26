import firebase from "firebase"
import Github from "github-api"
import { onAuth } from "../helpers/network.js"

export const SET_USER = "SET_USER"
export const SET_AUTH_USER = "SET_AUTH_USER"

// firebase.auth().user のユーザー情報
export function setAuthorizedUser(authorizedUser) {
  return {
    type: SET_AUTH_USER,
    authorizedUser
  }
}

/* Async Action Creators */

// firebase.ref("users").child(uid) のユーザー情報
export function setUser(user) {
  return {
    type: SET_USER,
    user
  }
}

export const fetchAuthorizedUser = () => (dispatch, getState) => {
  if (getState().authorizedUser) {
      return Promise.resolve()
  }

  return onAuth().then(user => dispatch(setAuthorizedUser(user)))
}

export const fetchUser = () => (dispatch, getState) => {
  return dispatch(fetchAuthorizedUser())
    .then(() => {
      const { authorizedUser } = getState()
      return firebase.database().ref("users").child(authorizedUser.uid).once("value")
    })
    .then(snap => dispatch(setUser(snap.val())))
}

/**
  Github を使う async action creator のためのヘルパー
  dispatch(fetchGithub()).then(github => {...}) のように使える
 */
export const fetchGithub = () => (dispatch, getState) => {
  return dispatch(fetchUser())
    .then(() => {
      const user = getState().user
      const github = new Github({token: user.access_token})
      return Promise.resolve(github)
    })
}
