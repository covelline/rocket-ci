#!/usr/bin/env ruby
require 'json'
require 'fileutils'
require 'base64'
require 'docker'
require 'google/cloud'
require 'google/cloud/storage'
require 'logger'
require 'open3'

# Docker のメタデータへのアクセスを禁止します
def refuse_access_metadata(logger)
  command = 'iptables -I DOCKER -o docker0 -i eth0 -s metadata.google.internal -p tcp -j DROP'
  run_command(logger, command)
end

# 成果物格納用ディレクトリをマウントします
def mount_artifact_dir(logger, current, repository_id, build_number)
  logger.debug { 'gcloud の認証を行います' }
  command = "gcloud auth activate-service-account --key-file #{current}/cred/rocket-ci-7a179946404e.json"
  run_command(logger, command)
  FileUtils.mkdir_p('/opt/destination')
  command = "gcsfuse --key-file #{current}/cred/rocket-ci-7a179946404e.json rocket-ci.appspot.com /opt/destination"
  run_command(logger, command)
  FileUtils.mkdir_p("/opt/destination/artifacts/#{repository_id}/#{build_number}")
end

def restore_cache(logger, cache_bucket, repository_id)
  if RemoteCache.exist?(cache_bucket, repository_id)
    logger.debug { "#{RemoteCache.cache_url(cache_bucket, repository_id)} からキャッシュの復元を行います" }
    RemoteCache.restore(cache_bucket, repository_id)
  else
    logger.debug { "#{RemoteCache.cache_url(cache_bucket, repository_id)} にキャッシュがありませんでした" }
  end
end

def change_github_build_status(logger, github, message, hash)
  logger.debug { "github の #{hash} の build status を変更します. message: #{message.to_json}" }
  res = github.status(hash, message.to_json)
  return if res.code.to_i > 199 && res.code.to_i < 300
  logger.debug { "github の build status の変更に失敗しました #{res.code}, #{res.message}" }
  raise res.message
end

def change_firebase_build_status(logger, umbilical, repository_id, build_number, statuses)
  path = "artifacts/#{repository_id}/#{build_number}"
  data = { gs_url: "gs://rocket-ci.appspot.com/artifacts/#{repository_id}/#{build_number}", build_status: statuses[:build_status], machine_status: statuses[:machine_status] }
  logger.debug { "firebase の #{path} を #{data.to_json} に更新します" }
  umbilical.database(path, data.to_json)
end

def fetch_private_key(logger, umbilical, repository_id)
  private_key_ref = "repository_private_keys/#{repository_id}"
  logger.debug { "firebase から #{private_key_ref} を取得します" }
  JSON.parse(umbilical.database(private_key_ref))
end

def register_github_deploy_key(logger, github, deploy_key)
  logger.debug { 'deploy key をgithubに設定します' }
  res = github.deploy_key(deploy_key.ssh_public_key)
  unless res.code.to_i > 199 && res.code.to_i < 300
    logger.debug { "deploy key の登録に失敗しました #{res.code}, #{res.message}" }
    raise res.message
  end
  logger.debug { 'deploy key の登録に成功しました' }
  JSON.parse(res.body)
end

def register_private_key(logger, umbilical, github, repository_id)
  private_key_ref = "repository_private_keys/#{repository_id}"
  logger.debug { "#{private_key_ref} に private key がありませんでした" }
  deploy_key = generate_deploy_key
  github_deploy_key = register_github_deploy_key(logger, github, deploy_key)
  logger.debug { "firebase の #{private_key_ref} にprivate key, deploy keyを設定します" }
  umbilical.database(private_key_ref, { key: Base64.encode64(deploy_key.private_key), deploy_key_id: github_deploy_key['id'], created_at: { '.sv' => 'timestamp' } }.to_json)
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

def create_docker_options(logger, repository)
  logger.debug { 'docker 起動オプションを作ります' }
  docker_environments = ['ROCKET_CACHE=/opt/cache', 'ROCKET_WORKSPACE=/opt/src']
  if repository.key?('environments')
    logger.debug { 'ユーザー定義の環境変数を追加します' }
    user_environments = create_environment_array(repository['environments']) { |v| Base64.decode64(v) }
    docker_environments += user_environments
  end
  {
    'HostConfig' => {
      'Binds' => [
        '/opt/android-sdk-linux:/opt/android-sdk-linux',
        '/opt/android-ndk:/opt/android-ndk',
        '/opt/cache:/opt/cache',
        '/opt/src:/opt/src'
      ]
    },
    'Env' => docker_environments
  }
end

DEBUG = ARGV[0] == 'D'
Dir[File.dirname(__FILE__) + '/lib/*.rb'].each { |file| require file }
BUILD_SCRIPT_PATH = '/opt/src/rocket.sh'.freeze
TEST = ENV['TEST'] == 'true'
# rubocop:disable Metrics/AbcSize, Metrics/CyclomaticComplexity, Metrics/PerceivedComplexity
def run
  current = File.dirname(__FILE__)
  gcloud = Google::Cloud.new('rocket-ci', "#{current}/cred/rocket-ci-7a179946404e.json")
  logging = gcloud.logging
  resource = logging.resource('gce_instance')
  logger = DEBUG ? Logger.new(STDOUT) : logging.logger('startup_log', resource)

  logger.info { 'メタデータを取得します' }
  hostname, instance_id, = instance_metadata(logger)
  build_number, repository_id, traffic_limit, pull_request_html_url, cache_bucket_name = external_metadata(logger)
  owner, name, pull_request_number = pull_request_url_parser(logger, pull_request_html_url)
  cache_bucket = gcloud.storage.bucket(cache_bucket_name)
  logger = DEBUG ? Logger.new(STDOUT) : logging.logger('startup_log', resource, instance_id: instance_id, instance_host_name: hostname, build_number: build_number, repository_owner: owner, repository_name: name, pull_request_number: pull_request_number)

  logger.info { "#{hostname} でビルドを行います" }
  logger.info { 'Docker のメタデータへのアクセスを禁止します' }
  refuse_access_metadata(logger)

  umbilical = UmbilicalClient.default_client
  logger.info { 'firebase からリポジトリ関連の情報を取得します' }
  repository, auth_user, artifact = firebase_repositories_data(logger, umbilical, repository_id, build_number)
  github = Github.new(owner, name, auth_user['access_token'])

  logger.info { '成果物ディレクトリをマウントします' }
  mount_artifact_dir(logger, current, repository_id, build_number)
  logger.info { "pull/#{owner}/#{name}/pull/#{pull_request_number} をビルドします" }
  restore_cache(logger, cache_bucket, repository_id)
  logger.info { 'github/firebase のビルドステータスを pending に変更します' }
  change_github_build_status(logger, github, { state: 'pending', description: 'building', context: 'rocket-ci', target_url: "https://rocket-ci.com/@#{owner}/#{name}/#{build_number}" }, artifact['hash'])
  change_firebase_build_status(logger, umbilical, repository_id, build_number, build_status: 'pending', machine_status: 'running')
  logger.info { 'private key を取得します' }
  private_key = fetch_private_key(logger, umbilical, repository_id)
  unless private_key.key?('key')
    register_private_key(logger, umbilical, github, repository_id)
    private_key = fetch_private_key(logger, umbilical, repository_id)
  end
  logger.info { 'github から pull request を取得します' }
  pull_request = fetch_pull_request(logger, github, pull_request_number)
  logger.info { "github から #{owner}/#{name}/pull/#{pull_request_number} のソースコードを取得します" }
  get_source(logger, Base64.decode64(private_key['key']), pull_request, artifact)
  raise 'rocket.sh がありませんでした。リポジトリのルートに rocket.sh を配置してください。ビルドを終了します' unless File.exist?(BUILD_SCRIPT_PATH)
  logger.info { 'firebase のビルドステータスを build に変更します' }
  change_firebase_build_status(logger, umbilical, repository_id, build_number, build_status: 'build', machine_status: 'running')
  docker_options = create_docker_options(logger, repository)
  FileUtils.mkdir_p('/opt/build_log')
  build_logger = DEBUG ? BuildLogger.new_logger(shift_size: 1 * 1024) : BuildLogger.new_logger
  logger.info { 'ビルドを開始します' }
  container = Docker::Image.get('android:latest').run(nil, docker_options)
  traffic_limit_monitor(logger, traffic_limit) do
    container.stop
  end
  container.streaming_logs(
    'stdout' => true,
    'stderr' => true,
    'timestamps' => false,
    'follow' => true
  ) do |_, chunk|
    build_logger.info { chunk.strip }
  end
  exit_code = Docker::Container.get(container.id).info['State']['ExitCode']
  status = exit_code.zero? ? 'success' : 'failure'
  # ビルド結果をファイルへ書き出す
  File.write('/opt/result.txt', status)
  logger.info { "ビルドが #{status} で終了しました" }
rescue => e
  logger.error { "エラーが発生しました。処理を中断します #{e.message} #{e.backtrace}" }
ensure
  unless DEBUG
    logger.info { '全ての処理を終了してシャットダウンします' }
    `sudo shutdown -h now`
  end
end
# rubocop:enable Metrics/AbcSize, Metrics/CyclomaticComplexity, Metrics/PerceivedComplexity
unless TEST
  run
end
