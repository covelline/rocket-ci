import React, { Component, PropTypes } from "react"
import { connect } from "react-redux"
import { withRouter } from "react-router"
import _ from "lodash"
import Helmet from "react-helmet"
import firebase from "firebase"
import RepositoryTitle from "../components/RepositoryTitle"

import {
  fetchGithub,
  fetchRepos,
  fetchRepoByName,
  subscribeFirebaseRepo,
  unsubscribeFirebaseRepo
} from "../actions"

import {
  toBase64FromString,
  toStringFromBase64
} from "../helpers/base64"

import "./RepositorySettingsPage.css"

function EnvironmentsTable(props) {

  const {environments, onClickAdd, onClickRemove, onChange } = props

  const envs = _(environments)
    .entries()
    .map(e => {
      return <EnvTableRow
        key={e[0]}
        name={e[1].name}
        value={toStringFromBase64(e[1].value)}
        envId={e[0]}
        onClickRemove={onClickRemove}
        editable={false}
      />
    })
    .value()

  envs.push(<EnvTableRow
    key="editable"
    {...props.editingEnv}
    onClickAdd={onClickAdd}
    onChange={onChange}
    editable={true}
  />)

  return <table className="Environments">
    <tbody>
      {envs}
    </tbody>
  </table>
}

function EnvTableRow(props) {

  const { envId, name, value, onChange, onClickAdd, onClickRemove, editable } = props

  function add(e) {
    onClickAdd({name, value})
  }

  function change(e) {
    const val = {name, value}
    val[e.target.name] = e.target.value
    onChange("editingEnv", val)
  }

  function remove(e) {
    onClickRemove(envId)
  }

  const button = (() => {
    return editable
      ? <button className="addButton" type="button" onClick={add} disabled={name.length <= 0}>Add</button>
      : <button className="removeButton" type="button" onClick={remove} >Remove</button>
  })()

  return <tr>
    <th><input name="name" disabled={!editable} type="text" placeholder="Name" value={name} onChange={change}/></th>
    <th><input name="value" disabled={!editable} type="text" placeholder="Value" value={value} onChange={change}/></th>
    <th>{button}</th>
  </tr>
}

function requireFuncIfEditableIs(condition) {
  return function(props, propName, componentName) {
    if (props.editable === condition)
      if (!props[propName]) {
        return new Error(`editable == ${condition} の場合は ${propName} は必須.`)
      }
  }
}

EnvTableRow.propTypes = {
  envId: requireFuncIfEditableIs(false),
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  editable: PropTypes.bool.isRequired,

  // 値が変更されたときに呼ばれる
  // onChange(name = editingEnv, value)
  onChange: requireFuncIfEditableIs(true),

  // env が入ってくる
  onClickAdd: requireFuncIfEditableIs(true),

  // envId が入ってくる
  onClickRemove: requireFuncIfEditableIs(false)
}

EnvTableRow.defaultProps = {
  name: "",
  value: ""
}

class RepositorySettingsPage extends Component {

  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidMount() {

    const { repos, params, fetchGithub, subscribeFirebaseRepo } = this.props
    const { org_name, repo_name } = params

    fetchGithub()
      .then(github => fetchRepoByName(github, org_name, repo_name, repos))
      .then(repo => {
        this.setState({repo})
        subscribeFirebaseRepo(repo.id)
      })
      .catch(e => { console.log(e) })
  }

  componentWillUnmount() {
    const { repos, params, fetchGithub, unsubscribeFirebaseRepo } = this.props
    const { org_name, repo_name } = params

    fetchGithub()
      .then(github => fetchRepoByName(github, org_name, repo_name, repos))
      .then(repo => unsubscribeFirebaseRepo(repo.id))
      .catch(e => { console.log(e) })
  }

  add(env) {

    const repoId = this.state.repo.id
    const name = env.name
    const value = toBase64FromString(env.value)

    firebase.database().ref("repositories")
      .child(`${repoId}/environments`)
      .push({
        name,
        value
      })

    this.setState({editingEnv: null})
  }

  remove(id) {

    const repoId = this.state.repo.id

    firebase.database().ref("repositories")
      .child(`${repoId}/environments/${id}`)
      .remove()
  }

  change(name, value) {
    const state = {}
    state[name] = value
    this.setState(state)
  }

  render() {

    const { firebaseRepo } = this.props
    const { repo, editingEnv } = this.state

    return <div className="RepositorySettingsPage">
      <Helmet title="Repository Settings" />
      <h2>Repository Settings</h2>
      {repo && <RepositoryTitle repo={repo} />}
      <h3>環境変数</h3>
      <p>環境変数の暗号化はしておりません。 セキュアな情報を格納する場合は暗号化済みの値を使用することをおすすめします。</p>
      {firebaseRepo && <EnvironmentsTable
        editingEnv={editingEnv}
        environments={firebaseRepo.environments}
        onChange={this.change.bind(this)}
        onClickAdd={this.add.bind(this)}
        onClickRemove={this.remove.bind(this)}
      />}
    </div>
  }
}

function mapStateToProps(state) {
  return {
    firebaseRepo: state.firebaseRepository
  }
}

function mapDispatchToProps(dispatch, ownProps) {
  return {
    fetchRepos: () => dispatch(fetchRepos()),
    fetchGithub: () => dispatch(fetchGithub()),
    subscribeFirebaseRepo: (id) => dispatch(subscribeFirebaseRepo(id)),
    unsubscribeFirebaseRepo: (id) => dispatch(unsubscribeFirebaseRepo(id))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(RepositorySettingsPage))
