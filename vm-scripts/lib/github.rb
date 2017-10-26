require 'net/https'
require 'json'

# Pull Request のURLをパースし、必要な情報を取得します
# [owner, name, number]
def pull_request_url_parser(logger, url)
  logger.debug { "Pull Request のURLをパースします: #{url}" }
  u = url.gsub('https://github.com/', '')
  matcher = u.match(%r{(.+)/(.+)/pull/(\d+)})
  owner = matcher[1]
  name = matcher[2]
  number = matcher[3]
  logger.debug { "owner: #{owner}, name: #{name}, number: #{number}" }
  [owner, name, number]
end

#
# Github
#
class Github
  attr_accessor :owner
  attr_accessor :repo
  attr_accessor :token

  def initialize(owner, repo, token)
    @owner = owner
    @repo = repo
    @token = token
  end

  def status(hash, message)
    github = request_url
    github.post(
      "/repos/#{@owner}/#{@repo}/statuses/#{hash}",
      message,
      'Authorization' => "token #{@token}")
  end

  def deploy_key(deploy_key)
    github = request_url
    github.post(
      "/repos/#{@owner}/#{@repo}/keys",
      {
        'title' => 'rocket-ci',
        'key' => deploy_key,
        'read_only' => true
      }.to_json,
      'Authorization' => "token #{@token}")
  end

  def pull_request(number)
    github = request_url
    github.get(
      "/repos/#{@owner}/#{@repo}/pulls/#{number}",
      'Authorization' => "token #{@token}"
    )
  end

  def request_url
    uri = URI.parse('https://api.github.com')
    github = Net::HTTP.new(uri.host, uri.port)
    github.use_ssl = true
    github.open_timeout = 10
    github.verify_mode = OpenSSL::SSL::VERIFY_NONE
    github
  end
end


def change_github_build_status(logger, github, message, hash)
  logger.debug { "github の #{hash} の build status を変更します. message: #{message.to_json}" }
  res = github.status(hash, message.to_json)
  return if res.code.to_i > 199 && res.code.to_i < 300
  logger.debug { "github の build status の変更に失敗しました #{res.code}, #{res.message}" }
  raise res.message
end

def fetch_pull_request(logger, github, pull_request_number)
  logger.debug { "github から pulls/#{pull_request_number} を取得します" }
  res = github.pull_request(pull_request_number)
  if res.code.to_i > 199 && res.code.to_i < 300
    gh_event = JSON.parse(res.body)
    logger.debug { "pull request の取得に成功しました: #{gh_event}" }
    return gh_event
  end
  logger.debug { "github から pulls/#{pull_request_number} の取得に失敗しました #{res.code}, #{res.message}" }
  raise res.message
end
