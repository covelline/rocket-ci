import { combineReducers } from "redux"
import { routerReducer } from "react-router-redux"
import {
  SET_USER,
  SET_AUTH_USER,
  SET_REPOS,
  SET_SELECTED_REPO,
  UPDATE_FIREBASE_REPO,
  SET_FIREBASE_REPO_REFERENCES,
  SET_BUILDS,
  SET_SELECTED_BUILD,
  SET_BUILD_LOG,
  SET_BUILD_FILES
} from "./actions"

function user(state = null, action) {
  switch(action.type) {
    case SET_USER:
      return action.user
    default:
      return state
  }
}

function authorizedUser(state = null, action) {
  switch(action.type) {
    case SET_AUTH_USER:
      return action.authorizedUser
    default:
      return state
  }
}

function repos(state = [], action) {
  switch(action.type) {
    case SET_REPOS:
      return action.repos
    default:
      return state
  }
}

function selectedRepository(state = null, action) {
  switch(action.type) {
    case SET_SELECTED_REPO:
      return action.selectedRepository
    default:
      return state
  }
}

function firebaseRepository(state = null, action) {
  switch(action.type) {
    case UPDATE_FIREBASE_REPO:
      return action.repo
    default:
      return state
  }
}

function firebaseRepositoryReferences(state = {}, action) {
  switch(action.type) {
    case SET_FIREBASE_REPO_REFERENCES:
      return action.refs
    default:
      return state
  }
}

function builds(state = [], action) {
  switch(action.type) {
    case SET_BUILDS:
      return action.builds
    default:
      return state
  }
}

function selectedBuild(state = null, action) {
  switch(action.type) {
    case SET_SELECTED_BUILD:
      return action.selectedBuild
    default:
      return state
  }
}

function buildLog(state = null, action) {
  switch (action.type) {
    case SET_BUILD_LOG:
      return action.buildLog
    default:
      return state
  }
}

function buildFiles(state = null, action) {
  switch (action.type) {
    case SET_BUILD_FILES:
      return action.files
    default:
      return state
  }
}

export default combineReducers({
  routing: routerReducer,
  user,
  authorizedUser,
  repos,
  selectedRepository,
  firebaseRepository,
  firebaseRepositoryReferences,
  builds,
  selectedBuild,
  buildLog,
  buildFiles
})
