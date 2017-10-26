import React, { PropTypes, Component } from "react"
import Helmet from "react-helmet"
import { Link } from "react-router"
import { notify } from "react-notify-toast"
import { connect } from "react-redux"
import { withRouter } from "react-router"
import { signInWithPopup } from "../helpers/network"
import { fetchAuthorizedUser } from "../actions"

class LoginPage extends Component {
  componentDidMount() {
    this.props.onLoad()
  }

  render() {
    const props = this.props

    return <div className="LoginPage">
      <Helmet title="Login" />
      <h2>Login</h2>
      {!props.isLoggedIn && <button
        onClick={props.onClickSignUpButton}
        disabled={props.isLoggedIn}>Sign up with Github</button>}
      {props.isLoggedIn && <button
        onClick={props.onClickLogoutButton}>Logout</button>}
      <div className="description">
        登録することで、Rocket の<Link to="/terms">利用規約</Link>と<Link to="/privacy">プライバシーポリシー</Link>に同意するものとします。
      </div>
    </div>
  }
}

LoginPage.propTypes = {
  authButtonDisabled: PropTypes.bool.isRequired
}

LoginPage.defaultProps = {
  authButtonDisabled: true
}

function mapStateToProps(state) {
  return {
    isLoggedIn: state.authorizedUser != null
  }
}

function mapDispatchToProps(dispatch, ownProps) {
  return {
    onLoad: () => {
      dispatch(fetchAuthorizedUser())
    },
    onClickSignUpButton: () => {
      const { router } = ownProps
      signInWithPopup()
        .then(() => {
          router.push("/repositories")
          return Promise.resolve()
        })
        .catch(e => {
          console.error(e)
          notify.show(`ログインに失敗しました。アカウントがクローズドテストで許可されていない場合は Slack チャンネルよりご参加下さい。`, "error")
        })
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(LoginPage))
