import React from "react"
import "./UserDropdown.css"

export default function UserDropdown(props) {
  const user = props.user
  return <div className="UserDropdown">
    <header>
      <img src={`https://avatars3.githubusercontent.com/u/${user.user_id}?v=3&s=40`}
        alt={user.github_username} />
      <p className="title">{user.github_username}</p>
    </header>
    <ul>
      <li onClick={props.onClickSignOut}>Logout</li>
    </ul>
  </div>
}
