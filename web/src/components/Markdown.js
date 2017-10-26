import React, { PropTypes, Component } from "react"
import Remarkable from "remarkable"
import hljs from "highlight.js"

import "highlight.js/styles/github.css"

const propTypes = {
  markdown: PropTypes.string.isRequired
}

const defaultProps = {
  markdown: ""
}

function rawMarkup(markdown) {
  const md = new Remarkable()
  const rawMarkup = md.render(markdown)
  return { __html: rawMarkup }
}

function MarkdownContent(props) {
  return <div className="Markdown" dangerouslySetInnerHTML={rawMarkup(props.markdown)}></div>
}

export default class Markdown extends Component {
  // シンタックスハイライトを更新
  updateHighlight() {
      document.querySelectorAll("pre code")
        .forEach(b => hljs.highlightBlock(b))
  }

  componentDidMount() {
    this.updateHighlight()
  }

  componentDidUpdate(prevProps, prevState) {
    this.updateHighlight()
  }

  render() {
    return <MarkdownContent {...this.props} />
  }
}

Markdown.propTypes = propTypes
Markdown.defaultProps = defaultProps
