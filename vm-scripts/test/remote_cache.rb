require 'test/unit'
require_relative '../lib/remote_cache.rb'

class TestRemoteCache < Test::Unit::TestCase

  def test_cache_path
    path = RemoteCache.cache_path(1000)
    assert_equal(path, 'caches/1000/cache.tar')
  end

  def test_cache_url
    bucket = Class.new do
      def self.name
        'bucket'
      end
    end
    url = RemoteCache.cache_url(bucket, 1000)
    assert_equal(url, 'gs://bucket/caches/1000/cache.tar')
  end

  def test_exist
    bucket = Class.new do
      def self.file(path)
        unless path == 'caches/1000/cache.tar'
          throw Exception.new("expected: caches/1000/cache.tar, actual: #{path}")
        end
        ''
      end
    end
    exist = RemoteCache.exist?(bucket, 1000)
    assert_true(exist)
  end
end
