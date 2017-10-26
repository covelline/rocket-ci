require 'net/https'
require 'json'
require 'logger'
#
#  rocket の Google App Engine のクライアント
#
class RocketAppengineClient
  attr_accessor :http_client
  attr_accessor :logger

  def initialize(api_url: ENV['ROCKET_HOOK_URL'], logger: Logger.new('/dev/null'))
    if api_url.nil?
      throw Exception.new('missing appengine andpoint. should set environment ROCKET_HOOK_URL')
    end
    uri = URI.parse(api_url)
    @http_client = Net::HTTP.new(uri.host, uri.port)
    @http_client.use_ssl = uri.scheme == 'https'
    @http_client.open_timeout = 10
    @http_client.verify_mode = OpenSSL::SSL::VERIFY_NONE if @http_client.use_ssl?
    @logger = logger
  end

  def rebuild(pull_request, build_number, hook_signature: ENV['ROCKET_HOOK_SIGNATURE'])
    if hook_signature.nil?
      throw Exception.new('missing hook signature. should set environment ROCKET_HOOK_SIGNATURE')
    end
    @logger.info { 'リビルドを行います' }
    data = {
      pull_request: pull_request,
      build_number: build_number,
      action: 'retry'
    }.to_json
    hmac = OpenSSL::HMAC.hexdigest('sha1', hook_signature, data)
    @logger.info { "data: #{data}" }
    @logger.info { "hmac: #{hmac}" }
    @http_client.post(
      '/',
      data,
      'X-Hub-Signature' => "sha1=#{hmac}",
      'X-GitHub-Event' => 'retry',
      'Content-Type' => 'application/json',
      'X-GitHub-Delivery' => "#{pull_request['base']['repo']['owner']['login']}/#{pull_request['base']['repo']['name']}/pull/#{pull_request['number']}/build/#{build_number}",
      'User-Agent' => 'vm-script'
    )
  end

  def delete_instance(zone, vm)
    @logger.info { "インスタンスを削除します zone: #{zone}, vm: #{vm}" }
    @http_client.delete(
      "/vm/#{zone}/#{vm}",
      'User-Agent' => 'vm-script'
    )
  end
end
