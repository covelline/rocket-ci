import _ from "lodash"

// リポジトリの配列を owner、リポジトリ名でソートする
export function sortRepositoriesByName(repos) {
  return _.chain(repos)
    .groupBy(r => r.owner.login)
    .map(rr => _.sortBy(rr, r => r.name))
    .flatten()
    .value()
}

// 設定済みのリポジトリだけフィルタする
export function filterConfiguredRepos(user, repos) {
  const configuredIds = (user && user.configured_repositories) || []
  return sortRepositoriesByName(repos.filter(r => configuredIds[r.id]))
}

