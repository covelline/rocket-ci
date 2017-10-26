require 'test/unit'
require 'logger'
require 'json'
require 'base64'

class TestStartUp < Test::Unit::TestCase

  def setup
    ENV['TEST'] = 'true'
    require_relative '../startup.rb'
  end

  def teardown
    ENV['TEST'] = nil
  end

  # change_firebase_build_status を行う
  def test_change_firebase_build_status
    logger = Logger.new(nil)
    repository_id = 1000
    build_number = 500
    statuses = { build_status: 'build', machine_status: 'running'}
    umbilical = Class.new do
      attr_accessor :res
      def database(path, data)
        @res = {}
        @res['path'] = path
        @res['data'] = JSON.parse(data)
      end
    end.new
    change_firebase_build_status(logger, umbilical, repository_id, build_number, statuses)
    assert_equal(umbilical.res['path'], 'artifacts/1000/500')
    assert_equal(umbilical.res['data']['gs_url'], 'gs://rocket-ci.appspot.com/artifacts/1000/500')
    assert_equal(umbilical.res['data']['build_status'], 'build')
    assert_equal(umbilical.res['data']['machine_status'], 'running')
  end

  # fetch_private_key を行う
  def test_fetch_private_key
    logger = Logger.new(nil)
    repository_id = 1000
    umbilical = Class.new do
      attr_accessor :res
      def database(path)
        @res = {}
        @res['path'] = path
        "{}"
      end
    end.new
    fetch_private_key(logger, umbilical, repository_id)
    assert_equal(umbilical.res['path'], 'repository_private_keys/1000')
  end

  # register_github_deploy_key を行う
  def test_register_github_deploy_key
    logger = Logger.new(nil)
    deploy_key = Class.new do
      def ssh_public_key
        'key'
      end
    end.new
    github = Class.new do
      def deploy_key(key)
        Class.new do
          def code
            '200'
          end
          def body
            '{}'
          end
        end.new
      end
    end.new
    register_github_deploy_key(logger, github, deploy_key)
  end

  # register_github_deploy_key に失敗するとき
  def test_register_github_deploy_key_when_failed
    logger = Logger.new(nil)
    deploy_key = Class.new do
      def ssh_public_key
        'key'
      end
    end.new
    github = Class.new do
      def deploy_key(key)
        Class.new do
          def code
            '404'
          end
          def message
            'message'
          end
        end.new
      end
    end.new
    assert_raise RuntimeError do
      register_github_deploy_key(logger, github, deploy_key)
    end
  end

  # register_private_key を行う
  def test_register_private_key
    logger = Logger.new(nil)
    repository_id = 1000
    umbilical = Class.new do
      attr_accessor :res
      def database(path, data)
        @res = JSON.parse(data)
        '{}'
      end
    end.new
    github = Class.new do
      def deploy_key(ssh_key)
        Class.new do
          def code
            '200'
          end
          def body
            '{}'
          end
        end.new
      end
    end.new
    register_private_key(logger, umbilical, github, repository_id)
    assert_true(umbilical.res.key?('key'))
    assert_true(umbilical.res.key?('deploy_key_id'))
    assert_true(umbilical.res.key?('created_at'))
  end

  # create_docker_options を行う
  def test_create_docker_options
    logger = Logger.new(nil)
    repository = {'environments' => { 'env1' => { 'name' => 'test', 'value' => Base64.encode64('test_value') } } }
    docker_options = create_docker_options(logger, repository)
    assert_equal(docker_options['HostConfig']['Binds'], ['/opt/android-sdk-linux:/opt/android-sdk-linux', '/opt/android-ndk:/opt/android-ndk', '/opt/cache:/opt/cache', '/opt/src:/opt/src' ])
    assert_equal(docker_options['Env'], ['ROCKET_CACHE=/opt/cache', 'ROCKET_WORKSPACE=/opt/src', 'test=test_value'])
  end
end
