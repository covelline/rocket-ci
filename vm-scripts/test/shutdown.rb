require 'test/unit'
require 'logger'

class TestShutdown < Test::Unit::TestCase

  def setup
    ENV['TEST'] = 'true'
    require_relative '../shutdown.rb'
    Dir.chdir(File.dirname(__FILE__)) do
      FileUtils.touch('result.txt')
    end
  end

  def teardown
    ENV['TEST'] = nil
    Dir.chdir(File.dirname(__FILE__)) do
      FileUtils.rm_rf('result.txt')
    end
  end

  # save_log_files_name を行う
  def test_save_log_files_name
    logger = Logger.new(nil)
    log_files = ['/path/to/log.txt.0', '/path/to/log.txt.1', '/path/to/log.txt.2']
    repository_id = 1000
    build_number = 500
    umbilical = Class.new do
      attr_accessor :res

      def initialize
        @res = []
      end
      def push(path, name)
        r = [{path: path, name: name}]
        @res += r
      end
    end.new
    save_log_files_name(logger, umbilical, log_files, repository_id, build_number)
    assert_equal(umbilical.res[0][:path], 'artifacts/1000/500/log')
    assert_equal(umbilical.res[0][:name], 'log.txt.0')
    assert_equal(umbilical.res[1][:path], 'artifacts/1000/500/log')
    assert_equal(umbilical.res[1][:name], 'log.txt.1')
    assert_equal(umbilical.res[2][:path], 'artifacts/1000/500/log')
    assert_equal(umbilical.res[2][:name], 'log.txt.2')
  end

  # save_log_files を行う
  def test_save_log_files
    logger = Logger.new(nil)
    log_files = ['/path/to/log.txt.0', '/path/to/log.text.1', '/path/to/log.txt.2']
    repository_id = 1000
    build_number = 500
    file_utils = Class.new do
      @@res = nil
      def self.cp(files, path)
        @@res = path
      end

      def self.result
        @@res
      end
    end
    save_log_files(logger, log_files, repository_id, build_number, file_utils)
    assert_equal(file_utils.result, '/opt/destination/artifacts/1000/500')
  end

  def test_read_state_when_file_not_exist
    logger = Logger.new(nil)
    s = read_state(logger, '')
    assert_equal(s, 'noncompletion')
  end

  def test_read_state_when_failure
    logger = Logger.new(nil)
    res = nil
    Dir.chdir(File.dirname(__FILE__)) do
      File.write('result.txt', 'failure')
      res = read_state(logger, 'result.txt')
    end
    assert_equal(res, 'failure')
  end

  def test_read_state_when_success
    logger = Logger.new(nil)
    res = nil
    Dir.chdir(File.dirname(__FILE__)) do
      File.write('result.txt', 'success')
      res = read_state(logger, 'result.txt')
    end
    assert_equal(res, 'success')
  end

  def test_read_state_when_error
    logger = Logger.new(nil)
    res = nil
    Dir.chdir(File.dirname(__FILE__)) do
      File.write('result.txt', 'hoge')
      res = read_state(logger, 'result.txt')
    end
    assert_equal(res, 'error')
  end

  def test_store_cache
    logger = Logger.new(nil)
    cache_bucket = {}
    repository_id = 1000
    remote_cache = Class.new do
      @@res = nil
      def self.cache_url(cache_bucket, repository_id)
        ""
      end

      def self.store(cache_bucket, repository_id, cache_path)
        @@res = cache_path
      end

      def self.result
        @@res
      end
    end
    store_cache(logger, cache_bucket, repository_id, remote_cache)
    assert_equal(remote_cache.result, '/opt/cache')
  end

  def test_store_cache_stat
    logger = Logger.new(nil)
    repository_id = 1000
    build_number = 500
    local_cache_storage = Class.new do
      def self.stat
        {}
      end
    end
    umbilical = Class.new do
      attr_accessor :res
      def database(path, data)
        @res = {}
        @res[:path] = path
        @res[:data] = path
      end
    end.new
    store_cache_stat(logger, umbilical, repository_id, build_number, local_cache_storage)
    assert_equal(umbilical.res[:path], 'artifacts/1000/500')
  end

  def test_cahnge_firebase_build_status
    logger = Logger.new(nil)
    repository_id = 1000
    build_number = 500
    statuses = { build_status: 'success', machine_status: 'finished' }
    umbilical = Class.new do
      attr_accessor :res
      def database(path, data)
        @res = {}
        @res[:path] = path
      end
    end.new
    change_firebase_build_status(logger, umbilical, repository_id, build_number, statuses)
    assert_equal(umbilical.res[:path], 'artifacts/1000/500')
  end

  def test_trigger_rebuild
    logger = Logger.new(nil)
    pull_request = {}
    build_number = 500
    appengine_client = Class.new do
      def rebuild(pull_request, build_number)
        Class.new do
          def code
            '200'
          end
        end.new
      end
    end.new
    trigger_rebuild(logger, appengine_client, pull_request, build_number)
  end

  def test_trigger_rebuild_when_failure
    logger = Logger.new(nil)
    pull_request = {}
    build_number = 500
    appengine_client = Class.new do
      def rebuild(pull_request, build_number)
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
      trigger_rebuild(logger, appengine_client, pull_request, build_number)
    end
  end

  def test_delete_instance
    logger = Logger.new(nil)
    hostname = 'host.internal.google.com'
    zone = {}
    appengine_client = Class.new do
      attr_accessor :res
      def delete_instance(zone, machine_name)
        @res = {}
        @res[:machine_name] = machine_name
        Class.new do
          def code
            '200'
          end
        end.new
      end
    end.new
    delete_instance(logger, appengine_client, hostname, zone)
  end

  def test_delete_instance_when_failure
    logger = Logger.new(nil)
    hostname = 'host.internal.google.com'
    zone = {}
    appengine_client = Class.new do
      attr_accessor :res
      def delete_instance(zone, machine_name)
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
      delete_instance(logger, appengine_client, hostname, zone)
    end
  end
end
