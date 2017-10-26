import React from "react"
import Helmet from "react-helmet"
import { Link } from "react-router"

export default function AdminPage(props) {
  return <div className="AdminPage">
    <Helmet title="Admin" />
    <h2>Admin</h2>
    <ul>
      <li><Link to="/admin/console">Console</Link></li>
      <li><Link to="/admin/post">Post</Link></li>
    </ul>
  </div>
}
