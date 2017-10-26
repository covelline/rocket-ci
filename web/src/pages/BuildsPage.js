import React, { Component } from "react"
import { Link, withRouter } from "react-router"
import { connect } from "react-redux"
import _ from "lodash"
import Icon from "react-fontawesome"
import moment from "moment"
import Helmet from "react-helmet"
import Activity from "react-activity"

import RepositoryTitle from "../components/RepositoryTitle"
import BuildStatus from "../components/BuildStatus"
import { filterConfiguredRepos } from "../helpers/github"

import {
  fetchRepos,
  fetchBuilds,
  fetchRepoByName,
  fetchGithub
} from "../actions"

import "./BuildsPage.css"

function BuildItem(props) {
  const b = props.build
  const r = props.repo
  return <li className={["BuildItem", b.build_status].join(" ")}>
    <Link to={`/@${r.full_name}/${props.buildNumber}`}>
      <p className="number">#{props.buildNumber}</p>
      <BuildStatus build={b} />
      {b.started_at && <p className="started-at">Started: {moment(b.started_at).fromNow()}</p>}
      {b.finished_at && <p className="finished-at">Finished: {moment(b.finished_at).fromNow()}</p>}
    </Link>
  </li>
}

function RepoItems(props) {
  if (props.builds.isFetching) {
    return <Activity.Dots />
  }

  if (props.builds.length === 0) {
    return <p>no builds</p>
  }

  const items = _.chain(props.builds)
    .entries()
    .filter(e => e[1] != null)
    .reverse()
    .map(e => <BuildItem build={e[1]} repo={props.repo} buildNumber={e[0]} key={e[0]} />)
    .value()

  return <ul className="BuildItems">
    {items}
  </ul>
}

function RepoDetail(props) {
  const repo = props.repository
  return <div className="RepoDetail">
    <header>
      <RepositoryTitle repo={repo} />
      <Link to={`/@${repo.full_name}/settings`} className="settings">
        <Icon name="cog" /> Settings
      </Link>
    </header>
    <div className="content">
      <h2>Recent Builds</h2>
    </div>
    <RepoItems builds={props.builds} repo={repo} />
  </div>
}

function BuildsPage(props) {
  const { repo, params } = props
  const onClickItem = repo => {
    props.selectRepository(repo)
  }

  const selectedRepoFullName =
    props.repo.full_name || `${params.org_name}/${params.repo_name}`

  const title = repo.full_name ? `Builds - ${repo.full_name}` : "Builds"

  return <div className="BuildsPage">
    <Helmet title={title} />
    <h2>Builds</h2>
    <div className="container">
      <div className="left">
        {props.repos.length === 0 ?
          <Activity.Dots /> :
          <ul className="RepoItems">
            {props.repos.map(r => {
              const selected = repo && r.full_name === selectedRepoFullName
              return <li key={r.id} className={selected ? "selected" : ""} onClick={() => onClickItem(r)}>{r.full_name}</li>
            })}
          </ul>
        }
      </div>
      <div className="right">
        {repo.isFetching ?
          <Activity.Dots /> :
          <RepoDetail
            repository={repo}
            builds={props.builds} />
        }
      </div>
    </div>
  </div>
}

function stateful(WrappedComponent) {
  return class extends Component {
    constructor(props) {
      super(props)

      this.state = {
        repo: {
          isFetching: true
        },
        builds: {
          isFetching: true
        }
      }
    }

    /**
      リポジトリ情報とビルド一覧を取得する
      ページを開いた時とリポジトリを切り替えた時に呼ぶ
      */
    loadRepository(orgName, repoName) {
      const { repos, fetchGithub } = this.props

      this.setState({
        repo: {
          isFetching: true
        },
        builds: {
          isFetching: true
        }
      })

      fetchGithub()
        .then(github => fetchRepoByName(github, orgName, repoName, repos))
        .then(repo => {
          this.setState({ repo })
          return fetchBuilds(repo.id)
        })
        .then(builds => {
          this.setState({ builds })
        })
        .catch(e => { console.error(e) })
    }

    componentDidMount() {
      const { params, fetchRepos } = this.props

      const isRepoSelected = params.org_name && params.repo_name

      fetchRepos()
        .then(() => {
          // リポジトリが選択されていなかったら一つ目をロードする
          if (!isRepoSelected && this.props.repos.length > 0) {
            const repo = this.props.repos[0]
            this.loadRepository(repo.owner.login, repo.name)
          }
        })
        .catch(e => { console.error(e) })

      if (isRepoSelected) {
        this.loadRepository(params.org_name, params.repo_name)
      }
    }

    render() {
      // リポジトリを切り替える
      const selectRepository = (repo) => {
        this.props.router.push(`/@${repo.full_name}/`)
        this.loadRepository(repo.owner.login, repo.name)
      }

      return <WrappedComponent {...this.props} {...this.state} selectRepository={selectRepository} />
    }
  }
}

function mapStateToProps(state, ownProps) {
  return {
    repos: filterConfiguredRepos(state.user, state.repos)
  }
}

function mapDispatchToProps(dispatch, ownProps) {
  return {
    fetchRepos: () => dispatch(fetchRepos()),
    fetchGithub: () => dispatch(fetchGithub())
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(stateful(BuildsPage)))
