import React from "react"
import { Link } from "react-router"

import "./RepositoryTitle.css"

export default function RepositoryTitle(props) {
  const repo = props.repo
  return <h1 className="RepositoryTitle">
    <span className="owner">{repo.owner.login}</span>
    <span className="divider"> / </span>
    <Link to={`/@${repo.full_name}/`} className="name">{repo.name}</Link>
    {repo.private && <p className="private">private</p>}
  </h1>
}
