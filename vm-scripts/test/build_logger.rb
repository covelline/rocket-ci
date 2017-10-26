require 'test/unit'
require 'fileutils'
require_relative '../lib/build_logger.rb'

class TestIncrementRotationLogger < Test::Unit::TestCase
  def setup
    Dir.chdir(File.dirname(__FILE__)) do
      FileUtils.mkdir_p('log')
      0.upto(10) do |i|
        FileUtils.touch("log/log.txt.#{i}")
      end
      FileUtils.touch('log/log.txt')
    end
  end

  def teardown
    Dir.chdir(File.dirname(__FILE__)) do
      FileUtils.rm_rf('log')
    end
  end

  def test_log_files
    Dir.chdir(File.dirname(__FILE__)) do
      list = BuildLogger.log_files(log_dir: 'log')
      assert_equal(list.size, 12)
      assert_equal(list[0], 'log/log.txt.0')
      assert_equal(list[1], 'log/log.txt.1')
      assert_equal(list[2], 'log/log.txt.2')
      assert_equal(list[3], 'log/log.txt.3')
      assert_equal(list[4], 'log/log.txt.4')
      assert_equal(list[5], 'log/log.txt.5')
      assert_equal(list[6], 'log/log.txt.6')
      assert_equal(list[7], 'log/log.txt.7')
      assert_equal(list[8], 'log/log.txt.8')
      assert_equal(list[9], 'log/log.txt.9')
      assert_equal(list[10], 'log/log.txt.10')
      assert_equal(list[11], 'log/log.txt')
    end
  end
end
