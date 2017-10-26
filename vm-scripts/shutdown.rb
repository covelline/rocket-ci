#!/usr/bin/env ruby
require 'json'
require 'fileutils'
require 'google/cloud'
require 'logger'
require 'pathname'

def save_log_files_name(logger, umbilical, log_files, repository_id, build_number)
  path = "artifacts/#{repository_id}/#{build_number}/log"
  logger.debug { "ログファイル一覧を firebase の #{path} に保存します" }
  log_files.each do |f|
    name = Pathname(f).basename.to_s
    umbilical.push(path, name)
  end
end

def save_log_files(logger, log_files, repository_id, build_number, file_utils = FileUtils)
  path = "/opt/destination/artifacts/#{repository_id}/#{build_number}"
  logger.debug { "ログファイルを #{path} に保存します" }
  file_utils.cp(log_files, path)
end

def read_state(logger, path = '/opt/result.txt')
  logger.debug { "#{path} を確認します" }
  unless File.exist?(path)
    logger.debug { "#{path} にファイルがありませんでした" }
    return 'noncompletion'
  end
  status = File.read(path)
  logger.debug { "#{path} の内容は #{status} でした" }
  case status
  when 'pending'
    return 'noncompletion'
  when 'failure'
    return 'failure'
  when 'success'
    return 'success'
  end
  'error'
end

def store_cache(logger, cache_bucket, repository_id, remote_cache = RemoteCache)
  cache_path = '/opt/cache'
  logger.debug { "キャッシュを #{remote_cache.cache_url(cache_bucket, repository_id)} に保存します" }
  remote_cache.store(cache_bucket, repository_id, cache_path)
end

def store_cache_stat(logger, umbilical, repository_id, build_number, local_cache_storage = LocalCacheStorage)
  path = "artifacts/#{repository_id}/#{build_number}"
  logger.debug { "キャッシュ情報を #{path} に保存します" }
  umbilical.database(path, { cache: local_cache_storage.stat }.to_json)
end

def change_firebase_build_status(logger, umbilical, repository_id, build_number, statuses)
  path = "artifacts/#{repository_id}/#{build_number}"
  data = { finished_at: { '.sv' => 'timestamp' }, build_status: statuses[:build_status], machine_status: statuses[:machine_status] }
  logger.debug { "firebase の #{path} を #{data.to_json} に更新します" }
  umbilical.database(path, data.to_json)
end

def trigger_rebuild(logger, appengine_client, pull_request, build_number)
  logger.debug { "#{build_number} のリビルドをトリガーします" }
  res = appengine_client.rebuild(pull_request, build_number)
  return if res.code.to_i > 199 && res.code.to_i < 300
  logger.debug { "リビルドのトリガーに失敗しました。 #{res.code}, #{res.message}" }
  raise res.message
end

def delete_instance(logger, appengine_client, hostname, zone)
  logger.debug { "#{hostname} を削除します" }
  machine_name = hostname.split('.').first
  res = appengine_client.delete_instance(zone, machine_name)
  return if res.code.to_i > 199 && res.code.to_i < 300
  logger.debug { "インスタンスの削除に失敗しました。 #{res.code}, #{res.message}" }
  raise res.message
end

DEBUG = ARGV[0] == 'D'
TEST = ENV['TEST'] == 'true'
Dir[File.dirname(__FILE__) + '/lib/*.rb'].each { |file| require file }

# rubocop:disable Metrics/AbcSize, Metrics/CyclomaticComplexity
def run
  current = File.dirname(__FILE__)
  gcloud = Google::Cloud.new('rocket-ci', "#{current}/cred/rocket-ci-7a179946404e.json")
  logging = gcloud.logging
  resource = logging.resource('gce_instance')
  logger = DEBUG ? Logger.new(STDOUT) : logging.logger('shutdown_log', resource)

  logger.info { 'メタデータを取得します' }
  hostname, instance_id, zone = instance_metadata(logger)
  build_number, repository_id, _, pull_request_html_url, cache_bucket_name = external_metadata(logger)
  owner, name, pull_request_number = pull_request_url_parser(logger, pull_request_html_url)
  cache_bucket = gcloud.storage.bucket(cache_bucket_name)
  logger = DEBUG ? Logger.new(STDOUT) : logging.logger('shutdown_log', resource, instance_id: instance_id, instance_host_name: hostname, build_number: build_number, repository_owner: owner, repository_name: name, pull_request_number: pull_request_number)

  logger.info { "#{hostname} のシャットダウン処理を開始します" }
  umbilical = UmbilicalClient.default_client
  logger.info { 'firebase からリポジトリ関連の情報を取得します' }
  _, auth_user, artifact = firebase_repositories_data(logger, umbilical, repository_id, build_number)
  github = Github.new(owner, name, auth_user['access_token'])
  appengine_client = RocketAppengineClient.new(logger: logger)

  logger.info { 'ログファイルの一覧を firebase に書き込みます' }
  save_log_files_name(logger, umbilical, BuildLogger.log_files, repository_id, build_number)
  logger.info { 'ログファイルを永続化します' }
  save_log_files(logger, BuildLogger.log_files, repository_id, build_number)
  case read_state(logger)
  when 'success'
    logger.info { 'ビルドに成功しました' }
    logger.info { 'キャッシュを保存します' }
    store_cache(logger, cache_bucket, repository_id)
    logger.info { 'キャッシュ情報を保存します' }
    store_cache_stat(logger, umbilical, repository_id, build_number)
    logger.info { 'github/firebase のビルドステータスを success に変更します' }
    change_github_build_status(logger, github, { state: 'success', description: 'success', context: 'rocket-ci', target_url: "https://rocket-ci.com/@#{owner}/#{name}/#{build_number}" }, artifact['hash'])
    change_firebase_build_status(logger, umbilical, repository_id, build_number, build_status: 'success', machine_status: 'finished')
  when 'failure'
    logger.info { 'ビルドに失敗しました' }
    logger.info { 'github/firebase のビルドステータスを failure に変更します' }
    change_github_build_status(logger, github, { state: 'failure', description: 'failure', context: 'rocket-ci', target_url: "https://rocket-ci.com/@#{owner}/#{name}/#{build_number}" }, artifact['hash'])
    change_firebase_build_status(logger, umbilical, repository_id, build_number, build_status: 'failure', machine_status: 'finished')
  when 'noncompletion'
    logger.info { 'ビルドが完了しませんでした' }
    logger.info { 'github/firebase のビルドステータスを error に変更します' }
    change_github_build_status(logger, github, { state: 'error', description: 'error', context: 'rocket-ci', target_url: "https://rocket-ci.com/@#{owner}/#{name}/#{build_number}" }, artifact['hash'])
    change_firebase_build_status(logger, umbilical, repository_id, build_number, build_status: 'error', machine_status: 'rebuilding')
    logger.info { 'ビルドをリトライします' }
    logger.info { 'Pull Request を取得します' }
    pull_request = fetch_pull_request(logger, github, pull_request_number)
    logger.info { 'リビルドをトリガーします' }
    trigger_rebuild(logger, appengine_client, pull_request, build_number)
  when 'error'
    logger.info { '未定義のビルド状態です' }
    logger.info { 'github/firebase のビルドステータスを error に変更します' }
    change_github_build_status(logger, github, { state: 'error', description: 'error', context: 'rocket-ci', target_url: "https://rocket-ci.com/@#{owner}/#{name}/#{build_number}" }, artifact['hash'])
    change_firebase_build_status(logger, umbilical, repository_id, build_number, build_status: 'error', machine_status: 'error')
  end
rescue => e
  logger.error { "エラーが発生しました #{e.message}, #{e.backtrace}" }
  change_github_build_status(logger, github, { state: 'error', description: 'error', context: 'rocket-ci', target_url: "https://rocket-ci.com/@#{owner}/#{name}/#{build_number}" }, artifact['hash'])
  change_firebase_build_status(logger, umbilical, repository_id, build_number, build_status: 'error', machine_status: 'error')
ensure
  unless DEBUG
    logger.info { "#{hostname} を削除します" }
    delete_instance(logger, appengine_client, hostname, zone)
  end
end
# rubocop:enable Metrics/AbcSize, Metrics/CyclomaticComplexity
unless TEST
  run
end
