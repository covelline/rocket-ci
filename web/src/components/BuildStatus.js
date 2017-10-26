import React from "react"
import "./BuildStatus.css"

export default function BuildStatus(props) {
  const b = props.build
  switch(b.build_status) {
    case "error": return <p className="BuildStatus error">error</p>
    case "failure": return <p className="BuildStatus failed">failed</p>
    case "success": return <p className="BuildStatus success">success</p>
    case "pending": return <p className="BuildStatus pending">{b.machine_status}</p>
    default: break
  }

  console.error("unknown build_status:", b.build_status)

  return null
}
