import React, { Component } from "react"
import MarkdownPage from "../pages/MarkdownPage"

export default function wrapMarkdownPage(props) {
  return class extends Component {
    render() {
      return <MarkdownPage {...props} />
    }
  }
}
