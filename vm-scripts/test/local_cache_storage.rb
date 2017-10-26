require 'test/unit'
require 'json'
require_relative '../lib/local_cache_storage.rb'

class TestLocalCacheStorage < Test::Unit::TestCase
  def setup
    Dir.chdir(File.dirname(__FILE__)) do
      FileUtils.mkdir_p('cache')
      FileUtils.touch('cache/app.apk')
      FileUtils.mkdir_p('cache/test/css')
      FileUtils.touch('cache/test/index.html')
      FileUtils.touch('cache/test/css/main.css')
      FileUtils.mkdir_p('cache/lint')
      FileUtils.touch('cache/lint/result.xml')
      FileUtils.mkdir_p('cache/.dot_file')
    end
  end

  def teardown
    Dir.chdir(File.dirname(__FILE__)) do
      FileUtils.rm_rf('cache')
    end
  end

  def test_stat
    stat = LocalCacheStorage.stat(mount_point: "#{File.dirname(__FILE__)}/cache")
    top_level_files = JSON.parse(stat[:top_level_files])
    assert_equal(top_level_files.size, 4)
    assert_true(stat[:storage][:limit_mb] > stat[:storage][:used_mb])
  end

end
