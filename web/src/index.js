import React from "react"
import { render } from "react-dom"
import { Router, Route, IndexRoute, browserHistory } from "react-router"
import { Provider } from "react-redux"
import { syncHistoryWithStore } from "react-router-redux"

import App from "./App"
import IndexPage from "./pages/IndexPage"
import LoginPage from "./pages/LoginPage"
import ErrorPage from "./pages/ErrorPage"
import BuildsPage from "./pages/BuildsPage"
import BuildsShowPage from "./pages/BuildsShowPage"
import RepositoriesPage from "./pages/RepositoriesPage"
import RepositorySettingsPage from "./pages/RepositorySettingsPage"
import PrivacyPage from "./pages/PrivacyPage"
import TermsPage from "./pages/TermsPage"

import PostPage from "./pages/admin/PostPage"
import AdminPage from "./pages/admin/AdminPage"
import ConsolePage from "./pages/admin/ConsolePage"

import wrapMarkdownPage from "./helpers/wrapMarkdownPage"
import configureStore from "./configureStore"

import "./index.css"

const store = configureStore()
const history = syncHistoryWithStore(browserHistory, store)

const PricingPage = wrapMarkdownPage({
  postId: "pricing",
  title: "Pricing",
  className: "PricingPage"
})
const MilestonesPage = wrapMarkdownPage({
  postId: "milestones",
  title: "Milestones",
  className: "MilestonesPage"
})

render(
  <Provider store={store}>
    <Router history={history}>
      <Route path="/" component={App}>
        <IndexRoute component={IndexPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/builds" component={BuildsPage} />
        <Route path="/@:org_name/:repo_name/" component={BuildsPage} />
        <Route path="/@:org_name/:repo_name/settings" component={RepositorySettingsPage} />
        <Route path="/@:org_name/:repo_name/:build_id" component={BuildsShowPage} />
        <Route path="/repositories" component={RepositoriesPage} />
        <Route path="/pricing" component={PricingPage} />
        <Route path="/milestones" component={MilestonesPage} />
        <Route path="/privacy" component={PrivacyPage} />
        <Route path="/terms" component={TermsPage} />
        <Route path="/admin" component={AdminPage} />
        <Route path="/admin/post" component={PostPage} />
        <Route path="/admin/console" component={ConsolePage} />
        <Route path="*" component={ErrorPage} />
      </Route>
    </Router>
  </Provider>,
  document.getElementById("root")
)
