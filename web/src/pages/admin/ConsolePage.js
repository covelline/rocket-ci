import React, { Component } from "react"
import { withRouter } from "react-router"
import _ from "lodash"
import moment from "moment"
import Helmet from "react-helmet"
import firebase from "firebase"
import queryString from "query-string"

import { onAuth } from "../../helpers/network"
import BuildStatus from "../../components/BuildStatus"

import "./ConsolePage.css"

function getMachineLogUrl(repoName, repoOwner, prNumber, buildNumber) {
  const params = {
    "metadata.labels.repository_name": repoName,
    "metadata.labels.repository_owner": repoOwner,
    "metadata.labels.pull_request_number": prNumber,
    "metadata.labels.build_number": buildNumber
  }

  const advancedFilter = _.entries(params).map(e => `${e[0]}="${e[1]}"`).join("\n")

  const query = queryString.stringify({
    project: "rocket-ci",
    minLogLevel: "0",
    expandAll: "false",
    resource: "appengine.googleapis.com",
    logName: "projects/rocket-ci/logs/appengine.googleapis.com/request_log",
    advancedFilter,
  })

  return `https://console.cloud.google.com/logs/viewer?${query}`
}

function ConsoleArtifact(props) {
  const a = props.artifact
  const matches = a.html_url.match(/https:\/\/github.com\/(.+)\/pull\/[0-9]+/)
  const fullName = matches[1]
  const buildUrl = `/@${fullName}/${a.build_number}`
  const repoOwner = fullName.split("/")[0]
  const repoName = fullName.split("/")[1]
  const machineLogUrl = getMachineLogUrl(repoName, repoOwner, a.pull_request_number, a.build_number)

  return <div className="ConsoleArtifact">
    <BuildStatus build={a} />
    <span className="repo-name">{fullName}</span> <span className="build_number"><a href={buildUrl} target="_blank">#{a.build_number}</a></span>
    <p className="repository_id">{a.repository_id}</p>
    <p className="started_at">{moment(a.started_at).fromNow(true)}</p>
    <p className="finished_at">{moment(a.finished_at).fromNow(true)}</p>
    <p className="gs_url">{a.gs_url}</p>
    <p className="hash">{a.hash}</p>
    <p className="pull_request">PR <a href={a.html_url} target="_blank">#{a.pull_request_number}</a></p>
    <p className="log_url"><a href={machineLogUrl} target="_blank">Log</a></p>
  </div>
}

function ConsoleArtifacts(props) {
  return <div className="ConsoleArtifacts">
    {props.artifacts.map(a => <ConsoleArtifact artifact={a} key={a.id} />)}
  </div>
}

const StatusFilterItem = (filter, toggleFilter) => aProps => {
  const { name } = aProps
  return <li
    className={filter[name] && "selected"}
    onClick={() => toggleFilter(name)}>{name}</li>
}

function ConsoleToolbar(props) {
  const BuildStatusFilterItem = StatusFilterItem(
    props.showBuildStatuses,
    props.toggleBuildStatusFilter
  )

  const MachineStatusFilterItem = StatusFilterItem(
    props.showMachineStatuses,
    props.toggleMachineStatusFilter
  )

  return <div className="ConsoleToolbar">
    <ul className="filter">
      <BuildStatusFilterItem name="pending" />
      <BuildStatusFilterItem name="success" />
      <BuildStatusFilterItem name="failure" />
      <BuildStatusFilterItem name="error" />
    </ul>
    <ul className="filter">
      <MachineStatusFilterItem name="booting" />
      <MachineStatusFilterItem name="running" />
      <MachineStatusFilterItem name="build" />
      <MachineStatusFilterItem name="finished" />
    </ul>
  </div>
}

/**

  repoId: { buildId: {} }
  -> [[repoId, buildId, ...]]

*/
function flattenArtifacts(artifacts) {
  return _.flatten(_.entries(artifacts).map(repos =>
    _.entries(repos[1]).map(builds => {
      return {
        id: `${repos[0]}#${builds[0]}`,
        repository_id: repos[0],
        build_number: builds[0],
        ...builds[1]
      }
    })
  ))
}

class ConsolePage extends Component {
  constructor(props) {
    super(props)
    this.state = {
      artifacts: {},
      showBuildStatuses: {
        "pending": true,
        "success": false,
        "failure": false,
        "error": false
      },
      showMachineStatuses: {
        "booting": true,
        "running": true,
        "build": true,
        "finished": true
      }
    }
  }

  componentDidMount() {
    onAuth()
      .then(authUser => {
        firebase.database().ref("artifacts").on("value", snap => {
          this.setState({
            artifacts: snap.val()
          })
        }, error => {
          this.props.router.replace("./error")
        })
      })
  }

  render() {
    const artifacts = _.chain(flattenArtifacts(this.state.artifacts))
      .filter(a => {
        if (!this.state.showBuildStatuses[a.build_status]) {
          return false
        }
        if (a.build_status === "pending") {
          return this.state.showMachineStatuses[a.machine_status]
        }
        return true
      })
      .sortBy("started_at")
      .reverse()
      .value()

    const toggleFilter = (filterName, name) => {
      this.setState({
        [filterName]: _.assign({}, this.state[filterName], {
          [name]: !this.state[filterName][name]
        })
      })
    }
    function toggleBuildStatusFilter(name) {
      toggleFilter("showBuildStatuses", name)
    }
    function toggleMachineStatusFilter(name) {
      toggleFilter("showMachineStatuses", name)
    }
    return <div className="ConsolePage">
      <Helmet title="Console" />
      <h2>Console</h2>
      <ConsoleToolbar
        showBuildStatuses={this.state.showBuildStatuses}
        showMachineStatuses={this.state.showMachineStatuses}
        toggleBuildStatusFilter={toggleBuildStatusFilter}
        toggleMachineStatusFilter={toggleMachineStatusFilter}
        />
      <ConsoleArtifacts artifacts={artifacts} />
    </div>
  }
}

export default withRouter(
  ConsolePage
)
