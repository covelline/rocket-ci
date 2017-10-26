import React, { Component } from "react"
import { Link, withRouter } from "react-router"
import { connect } from "react-redux"
import firebase from "firebase"

import { setAuthorizedUser, fetchUser } from "../actions"
import UserDropdown from "./UserDropdown"
import logo from "../images/logo.svg"
import "./Header.css"

class Header extends Component {
  componentDidMount() {
    this.props.onLoad()
  }

  render() {
    const props = this.props
    const isLoggedIn = props.isLoggedIn

    function onClickSignOut() {
      props.onClickSignOut(props.router)
    }

    return <header className="Header">
      <div className="inner">
      <h1><Link to="/"><img src={logo} alt="Rocket CI" /></Link></h1>

      <ul className="menu">
        {isLoggedIn && <li><Link to="/builds">Builds</Link></li>}
        {isLoggedIn && <li><Link to="/repositories">Repositories</Link></li>}
        <li><a href="https://github.com/rocket-ci/rocket-ci/wiki/Getting-Started" target="_blank">Guide</a></li>
        <li><a href="http://blog.covelline.com/archive/category/rocket-ci" target="_blank">Blog</a></li>
      </ul>

      <ul className="right-menu">
        {!isLoggedIn && <li><Link to="/login">Login</Link></li>}
        {isLoggedIn && props.user && <li><UserDropdown user={props.user} onClickSignOut={onClickSignOut} /></li>}
      </ul>
      </div>
    </header>
  }
}

function mapStateToProps(state) {
  return {
    isLoggedIn: state.authorizedUser != null,
    user: state.user
  }
}

function mapDispatchToProps(dispatch) {
  return {
    onLoad: () => {
      dispatch(fetchUser())
    },
    onClickSignOut: (router) => {
      firebase.auth().signOut()
        .then(() => { console.log("ログアウトしました") })
        .then(() => {
          dispatch(setAuthorizedUser(null))
          router.push("/")
        })
        .catch(e => { console.error(e) })
    }
  }
}


export default connect(mapStateToProps, mapDispatchToProps)(withRouter(Header))
