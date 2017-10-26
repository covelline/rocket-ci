import React, { Component } from "react"
import { Link } from "react-router"
import Helmet from "react-helmet"
import Markdown from "../components/Markdown"
import "./IndexPage.css"

const content = `
現在 Rocket CI はサービス停止中です。
`

export default class IndexPage extends Component {
  render() {
    return <div className="IndexPage">
      <Helmet title="Rocket CI" titleTemplate="%s" />
      <h2>Rocket で CI を始めよう</h2>
      <h3>従量課金であなたのチームにフィットする CI サービス</h3>
      <div className="description">
        <Markdown markdown={content} />
      </div>
    </div>
  }
}
