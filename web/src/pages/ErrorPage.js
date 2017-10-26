import React from "react"
import Helmet from "react-helmet"

export default function ErrorPage(props) {
  return <div className="ErrorPage">
    <Helmet title="Error" />
    <h2>Error</h2>
  </div>
}
