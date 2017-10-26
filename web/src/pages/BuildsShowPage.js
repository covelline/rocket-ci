import React, { Component } from "react"
import { connect } from "react-redux"
import { Link } from "react-router"
import Icon from "react-fontawesome"
import moment from "moment"
import Helmet from "react-helmet"
import Activity from "react-activity"
import { Tab, Tabs, TabList, TabPanel } from "react-tabs"

import RepositoryTitle from "../components/RepositoryTitle"
import BuildStatus from "../components/BuildStatus"
import BuildLog from "../components/BuildLog"
import {
  fetchRepoByName,
  fetchBuild,
  fetchBuildLog,
  fetchGithub
} from "../actions"

import "./BuildsShowPage.css"

function BuildsShowPage(props) {
  const { repo, build, buildLog } = props

  if (repo.isFetching || build.isFetching) {
    return <div className="BuildsShowPage">
      <Activity.Dots />
    </div>
  }

  return <div className="BuildsShowPage">
    <Helmet title={`Build #${props.params.build_id} - ${repo.full_name}`} />
    <Link to={`/@${repo.full_name}/`} className="back-button"><Icon name="chevron-left" /></Link>
    <RepositoryTitle repo={repo} />
    <div className="build-title">
      <h2>Build #{props.params.build_id}</h2>
      <BuildStatus build={build} />
    </div>
    <div className="build-description">
      <p><a href={build.html_url} target="_blank">PR #{build.pull_request_number}</a></p>
      {build.hash && <p className="hash">{build.hash.substr(0, 7)}</p>}
      {build.started_at && <p className="started-at">
        <span className="label">Started:</span> {moment(build.started_at).fromNow()}</p>}
      {build.finished_at && <p className="finished-at">
        <span className="label">Finished:</span> {moment(build.finished_at).fromNow()}</p>}
      <p className="machine-status">
        <span className="label">Machine Status:</span> {build.machine_status}</p>
    </div>
    <Tabs>
      <TabList>
        <Tab>Build Log</Tab>
      </TabList>
      <TabPanel>
        {buildLog.isFetching ?
          <Activity.Dots />
          : <BuildLog log={props.buildLog.text} />
        }
      </TabPanel>
    </Tabs>
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
        build: {
          isFetching: true
        },
        buildLog: {
          isFetching: true,
          text: ""
        }
      }
    }

    componentDidMount() {
      const { params, fetchGithub } = this.props

      fetchGithub()
        .then(github => {
          return fetchRepoByName(github, params.org_name, params.repo_name)
        })
        .then(repo => {
          this.setState({ repo })
          return fetchBuild(repo.id, params.build_id)
        })
        .then(build => {
          this.setState({ build })

          if (build.gs_url) {
            fetchBuildLog(build.gs_url)
              .then(text => {
                this.setState({ buildLog: {
                  text
                }})
              })
              .catch(e => {
                // テキストファイルが無いときは空
                this.setState({ buildLog: {
                  text: ""
                }})
              })
          } else {
            // gs_url が無いときは空
            this.setState({ buildLog: {
              text: ""
            }})
          }
        })
        .catch(e => { console.error(e) })
    }

    render() {
      return <WrappedComponent {...this.props} {...this.state} />
    }
  }
}

function mapStateToProps(state) {
  return {
  }
}

function mapDispatchToProps(dispatch) {
  return {
    fetchGithub: () => dispatch(fetchGithub())
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(stateful(BuildsShowPage))
