require 'test/unit'
require 'webmock/test_unit'
require_relative '../lib/appengine_client.rb'

class TestRocketAppengineClient < Test::Unit::TestCase

  def test_delete_instance
    stub_request(:delete, "https://hooks.rocket-ci.com/vm/test-zone/test-vm").
      with(:headers => {'Accept'=>'*/*', 'Accept-Encoding'=>'gzip;q=1.0,deflate;q=0.6,identity;q=0.3', 'User-Agent'=>'vm-script'}).
      to_return(:status => 200, :body => "", :headers => {})

    client = RocketAppengineClient.new(api_url: 'https://hooks.rocket-ci.com')
    res = client.delete_instance('test-zone', 'test-vm')
    assert_equal(res.code.to_i, 200)
  end

  def test_rebuild
    pull_request = JSON.parse(File.open("#{File.dirname(__FILE__)}/json/pull_request_event.json", 'r').read)['pull_request']
    build_number = 999
    data = {
      pull_request: pull_request,
      build_number: build_number,
      action: 'retry'
    }

    stub_request(:post, "https://hooks.rocket-ci.com/").
      with(body: data, headers: {'Accept'=>'*/*', 'Accept-Encoding'=>'gzip;q=1.0,deflate;q=0.6,identity;q=0.3', 'Content-Type'=>'application/json', 'User-Agent'=>'Ruby', 'X-Github-Delivery'=>'covelline/feather-for-android/pull/892/build/999', 'X-Github-Event'=>'retry', 'X-Hub-Signature'=>'sha1=5a9024999273b18eaa67abe97ee04d3a0f48d346', 'User-Agent' => 'vm-script'}).
      to_return(:status => 200)

    client = RocketAppengineClient.new(api_url: 'https://hooks.rocket-ci.com')
    res = client.rebuild(pull_request, build_number,hook_signature: 'xxx')
    assert_equal(res.code.to_i, 200)
  end
end
