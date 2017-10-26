import React, { Component } from "react"
import { notify } from "react-notify-toast"
import firebase from "firebase"
import Helmet from "react-helmet"
import Markdown from "../../components/Markdown"

import "./PostPage.css"

const pages = [
  {
    title: "not selected",
    id: false
  },
  {
    title: "Guide",
    id: "guide"
  },
  {
    title: "Milestones",
    id: "milestones"
  },
  {
    title: "Pricing",
    id: "pricing"
  },
]

export default class PostPage extends Component {
  constructor(props) {
    super(props)
    this.state = {
      text: "",
      postId: null
    }
  }

  render() {
    const onChangePageSelect = e => {
      const postId = e.target.value
      if (!postId) {
        return
      }
      firebase.database().ref("posts").child(postId).once("value")
        .then(snap => {
          const { body } = snap.val()
          this.setState({
            text: body,
            postId
          })
        })
        .catch(e => console.error(e))
    }
    const onChangeTextArea = e => {
      this.setState({
        text: e.target.value
      })
    }
    const onClickSave = e => {
      firebase.database().ref("posts").child(this.state.postId).update({
        body: this.state.text,
        updated_at: firebase.database.ServerValue.TIMESTAMP,
        updated_by: firebase.auth().currentUser.displayName
      })
        .then(() => notify.show("保存しました", "success"))
        .catch(e => notify.show(e.message, "error"))
    }
    return <div className="PostPage">
      <Helmet title="Post" />
      <h2>Post</h2>
      <select className="page-select" onChange={onChangePageSelect}>
        {pages.map(p => <option value={p.id} key={p.id}>{p.title}</option>)}
      </select>
      <div className="content">
        <div className="left">
          <textarea onChange={onChangeTextArea} value={this.state.text} />
        </div>
        <div className="right">
          <Markdown markdown={this.state.text} />
        </div>
      </div>
      <footer>
        <button onClick={onClickSave}>Save</button>
      </footer>
    </div>
  }
}
