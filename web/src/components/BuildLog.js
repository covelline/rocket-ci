import React from "react"

import "./BuildLog.css"

/**
  logger.rb format:
    SeverityID, [Date Time mSec #pid] SeverityLabel -- ProgName: message
*/
function parseLogLine(line) {
  const matched = line.match(/^([A-Z]), \[(.+) #([0-9]+)\][ ]{2}([A-Z]+) -- ([A-Za-z]*): (.*)/)
  if (matched) {
    return {
      severityID: matched[1],
      date: matched[2],
      pid: matched[3],
      severityLabel: matched[4],
      progName: matched[5],
      message: matched[6]
    }
  }
  return {
    severityLabel: "",
    message: line
  }
}

function parseLog(log) {
  return log.split("\n")
    .map(line => parseLogLine(line))
    .map((p, i) =>
      <p className={`line ${p.severityLabel}`} key={i}>{p.message}</p>
    )
}

export default function BuildLog(props) {
  return <div className="BuildLog">
    {
      props.log.length === 0 ?
        "No Logs"
        : parseLog(props.log)
    }
  </div>
}
