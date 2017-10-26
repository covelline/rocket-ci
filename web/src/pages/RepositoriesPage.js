import React, { Component } from "react"
import { connect } from "react-redux"
import Activity from "react-activity"
import { notify } from "react-notify-toast"
import Helmet from "react-helmet"

import { signInWithPopup } from "../helpers/network"

import {
  fetchGithub,
  fetchRepos,
  leaveRepoAction,
  setupRepoAction
} from "../actions"
import { sortRepositoriesByName } from "../helpers/github"

import "./RepositoriesPage.css"

function RepoItem(props) {
  const repo = props.repo

  function onClick() {
    props.onClick(repo)
  }

  function onClickLeave() {
    props.onClickLeave(repo)
  }

  return <li className="RepoItem">
    <div className="title">
      <span className="name">{repo.full_name}</span>
      {repo.private && <span className="private">private</span>}
    </div>
    {repo.configured ?
      <button className="leaveButton" onClick={onClickLeave}>✓ Configured</button> :
      <button className="addButton" onClick={onClick}>Add</button>
    }
  </li>
}

class RepositoriesPage extends Component {

  constructor(props) {
    super(props)

    this.state = {hasPrivateScope: undefined}
  }

  componentDidMount() {
    this.props.fetchRepos()
    const { fetchGithub } = this.props

    fetchGithub()
      .then(github => {
        return github.getUser().getProfile()
      })
      .then(result => {
        const hasPrivateScope = () => {
          const scopes = result.headers["x-oauth-scopes"]
          if (!scopes) {
            return false
          }
          return scopes.split(",").includes("repo")
        }

        this.setState({hasPrivateScope: hasPrivateScope()})
      })
      .catch(error => { console.error(error) })
  }


  render() {

    const {
      hasPrivateScope
    } = this.state

    const {
      repos,
      setupRepo,
      leaveRepo,
      fetchRepos,
      requestPrivateAccess
    } = this.props

    const onClickPrivateAccess = () => {
      requestPrivateAccess()
        .then(() => {
          fetchRepos()
          this.setState({hasPrivateScope: true})
        })
        .catch(error => { console.error(error) })
    }
    const repoItems = repos.map(r => {
      return <RepoItem repo={r} key={r.id} onClick={setupRepo} onClickLeave={leaveRepo}/>
    })

    return <div className="RepositoriesPage">
      <Helmet title="Repositories" />
      <h2>Repositories</h2>
      {repos.length === 0 ?
        <Activity.Dots /> :
        <ul className="RepoItems">
          {repoItems}
        </ul>
      }
      {hasPrivateScope === false ?
        <button onClick={onClickPrivateAccess}>プライベートリポジトリも許可する</button> :
      null }
    </div>
  }
}

function mapStateToProps(state) {
  // repos に設定済みかどうかのフラグを追加する
  const configuredIds = (state.user && state.user.configured_repositories) || []

  const repos = state.repos.map(r => {
    return {
      configured: !!configuredIds[r.id],
      ...r
    }
  })

  return {
    user: state.user,
    repos: sortRepositoriesByName(repos)
  }
}

function mapDispatchToProps(dispatch) {
  return {
    fetchGithub: () => dispatch(fetchGithub()),
    fetchRepos: () => {
      dispatch(fetchRepos())
        .catch(e => console.error(e))
    },
    setupRepo: (repo) => {
      dispatch(setupRepoAction(repo))
        .then(() => console.log("リポジトリのセットアップが完了しました"))
        .catch(e => notify.show(e.message, "error"))
    },
    leaveRepo: (repo) => {
      dispatch(leaveRepoAction(repo))
        .then(() => console.log("leave repo", repo))
        .catch(e => notify.show(e.message, "error"))
    },
    requestPrivateAccess: () => signInWithPopup(true)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(RepositoriesPage)
