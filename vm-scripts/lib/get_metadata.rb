require 'net/http'
require 'json'
require 'fileutils'
require 'pathname'

def metadata(path)
  metadata_server = Net::HTTP.new('metadata.google.internal')
  metadata_server.open_timeout = 10
  metadata_server.request_get(path, 'Metadata-Flavor' => 'Google').body
end

# 起動している仮想マシンインスタンスに関するメタデータを取得します
# [hostname, instance_id, zone]
def instance_metadata(logger)
  logger.debug { '仮想マシンに関するメタデータを取得します' }
  hostname = metadata('/computeMetadata/v1/instance/hostname').strip
  logger.debug { "ホスト名は #{hostname} です" }
  instance_id = metadata('/computeMetadata/v1/instance/id').strip
  logger.debug { "インスタンスid は #{instance_id} です" }
  zone = Pathname(metadata('/computeMetadata/v1/instance/zone').strip).basename
  [hostname, instance_id, zone]
end

# 仮想マシン起動時に外部から与えられたメタデータを取得します
# [build_number, repository_id, traffic_limit, pull_request_html_url, cache_bucket]
def external_metadata(logger)
  logger.debug { '仮想マシン起動時に与えられたメタデータを取得します' }
  vm_metadata = JSON.parse(metadata('/computeMetadata/v1/instance/attributes/?alt=json&recursive=true'))
  build_number = vm_metadata['build_number']
  logger.debug { "ビルド番号は #{build_number} です" }
  repository_id = vm_metadata['repository_id']
  logger.debug { "リポジトリーID は #{repository_id} です" }
  traffic_limit = vm_metadata['traffic_limit_mb'].to_i * 1024 * 1024
  logger.debug { "通信容量制限は #{traffic_limit} です" }
  pull_request_html_url = vm_metadata['pull_request_html_url']
  logger.debug { "Pull Request の URL は #{pull_request_html_url} です" }
  cache_bucket = vm_metadata['cache_bucket']
  [build_number, repository_id, traffic_limit, pull_request_html_url, cache_bucket]
end
