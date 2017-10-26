import React from "react"
import { Link } from "react-router"

import "./Footer.css"

export default function Footer(props) {
  return <div className="Footer">
    <ul className="menu">
      <li><Link to="/privacy">プライバシーポリシー</Link></li>
      <li><Link to="/terms">利用規約</Link></li>
      <li><a href="https://rocket-ci.herokuapp.com/">Slack</a></li>
      <li><a href="https://twitter.com/rocket_ci">Twitter</a></li>
    </ul>
    <p className="copyright">
      &copy; {new Date().getYear() + 1900} <a href="http://covelline.com/">covelline, LLC.</a>
    </p>
  </div>
}
