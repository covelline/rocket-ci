require 'test/unit'
require 'logger'
require_relative '../lib/github.rb'

class TestGithub < Test::Unit::TestCase
 # github_build_status を行う
  def test_github_build_status
    logger = Logger.new(nil)
    message = {}
    hash = "hash"
    github = Class.new do
      def status(hash, message)
        Class.new do
          def code
            '200'
          end
        end.new
      end
    end.new
    change_github_build_status(logger, github, message, hash)
  end

  # github_build_status に失敗したとき
  def test_github_build_status_when_failed
    logger = Logger.new(nil)
    message = {}
    hash = "hash"
    github = Class.new do
      def status(hash, message)
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
      change_github_build_status(logger, github, message, hash)
    end
  end

  # fetch_pull_request を行う
  def test_fetch_pull_request
    logger = Logger.new(nil)
    pull_request_number = 100
    github = Class.new do
      attr_accessor :res
      def pull_request(number)
        @res = {}
        @res['number'] = number
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
    fetch_pull_request(logger, github, pull_request_number)
    assert_equal(github.res['number'], pull_request_number)
  end

  # fetch_pull_request に失敗する
  def test_fetch_pull_request_when_failed
    logger = Logger.new(nil)
    pull_request_number = 100
    github = Class.new do
      def pull_request(number)
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
      fetch_pull_request(logger, github, pull_request_number)
    end
  end
end
