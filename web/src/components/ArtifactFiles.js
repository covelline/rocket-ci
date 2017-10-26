import React, { Component } from "react"

import "./ArtifactFiles.css"

/**

 成果物の files.json を表示するコンポーネント
 ディレクトリを開閉できる

*/

class ArtifactFile extends Component {
  constructor(props) {
    super(props)

    this.state = {
      isOpened: false
    }
  }

  render() {
    const { props } = this
    const { file } = props
    const hasChild = !!file.children

    const onClick = () => {
      if (hasChild) {
        this.setState({
          isOpened: !this.state.isOpened
        })
      } else {
        props.onClick(file)
      }
    }

    return <div className={`ArtifactFile ${hasChild ? "directory" : "file"} ${this.state.isOpened ? "opened" : "closed"}`}>
      <p className="name" onClick={onClick}>{file.name}</p>
      {hasChild &&
        <div className="children">
          {file.children.map(f => createArtifactFile(f, props.onClick))}
        </div>
      }
    </div>
  }
}

function createArtifactFile(f, onClick) {
  return <ArtifactFile file={f} key={f.path} onClick={onClick} />
}

export default function ArtifactFiles(props) {
  return <div className="ArtifactFiles">
    {props.files.map(f => createArtifactFile(f, props.onClickFile))}
  </div>
}
