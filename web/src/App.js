import React, { Component } from "react"
import Helmet from "react-helmet"
import firebase from "firebase"
import Notifications from "react-notify-toast"
import Header from "./components/Header"
import Footer from "./components/Footer"
import headerConfig from "./headerConfig"

import "./App.css"
import "./App-mobile.css"
import "react-activity/dist/react-activity.css"

export default class App extends Component {
  constructor(props) {
    super(props)

    // Initialize Firebase
    firebase.initializeApp({
      apiKey: "your",
      authDomain: "firebase",
      databaseURL: "setting",
      storageBucket: "here",
    })
  }

  render() {
    return <div className="App">
      <Helmet {...headerConfig} />
      <Header />
      <div id="content">
        {this.props.children}
      </div>
      <Footer />
      <Notifications />
    </div>
  }
}
