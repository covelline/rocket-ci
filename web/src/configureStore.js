import { createStore, applyMiddleware } from "redux"
import thunk from "redux-thunk"
import createLogger from "redux-logger"

import reducers from "./reducers"

export default function configureStore(preloadedState) {
  let middleware = [thunk]

  if (process.env.NODE_ENV !== "production") {
    // デバッグ環境で使う middleware を追加する
    middleware = [...middleware, createLogger()];
  }

  const store = createStore(
    reducers,
    preloadedState,
    applyMiddleware(...middleware)
  )

  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    // https://github.com/reactjs/redux/blob/master/examples/async/store/configureStore.js
    module.hot.accept("./reducers", () => {
      const nextRootReducer = require("./reducers").default
      store.replaceReducer(nextRootReducer)
    })
  }

  return store
}
