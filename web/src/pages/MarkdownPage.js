import React, { Component, PropTypes } from "react"
import firebase from "firebase"
import Activity from "react-activity"
import Helmet from "react-helmet"
import Markdown from "../components/Markdown"

export default class MarkdownPage extends Component {
  constructor(props) {
    super(props)

    this.state = {
      body: null
    }
  }

  componentDidMount() {
    const { postId } = this.props
    firebase.database().ref("posts").child(postId).once("value")
      .then(snap => {
        const { body } = snap.val()
        this.setState({ body })
      })
      .catch(e => console.error(e))
  }

  render() {
    const { props, state } = this
    return <div className={props.className}>
      <Helmet title={props.title} />
      <h2>{props.title}</h2>
      {state.body ?
        <Markdown markdown={state.body} />
        : <Activity.Dots />
      }
    </div>
  }

  static propTypes = {
    className: PropTypes.string,
    title: PropTypes.string.isRequired,
    postId: PropTypes.string.isRequired
  }
}
