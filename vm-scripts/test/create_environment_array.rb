require 'test/unit'
require_relative '../lib/create_environment_array.rb'
require 'json'
require 'base64'

class TestCreateEnvironmentArray < Test::Unit::TestCase

  attr_accessor :repository

  def setup
    json =
<<EOF
{
  "artifacts_visibility" : "private",
  "configured_users" : {
    "6kpUrWcT72SLs5eWIihTFyRik0z2" : {
      "github_username" : "numa08",
      "user_id" : 937552
    }
  },
  "environments" : {
    "-KTw11jWoiFPmEAmrqK1" : {
      "name" : "GO_VERSION",
      "value" : "MS43LjE="
    }
  },
  "hook_id" : 10295198,
  "repository_full_name" : "rocket-ci/gae-go-example",
  "token_auth_id" : "6kpUrWcT72SLs5eWIihTFyRik0z2"
}
EOF
  @repository = JSON.parse(json)
  end

  def test_create_environment_array
    environments = @repository['environments']
    array = create_environment_array(environments) { |e| Base64.decode64(e) }
    assert_equal(array[0], 'GO_VERSION=1.7.1')
  end
end
