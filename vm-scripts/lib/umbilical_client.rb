require 'json'

#
#  umbilical コマンドの ruby ラッパー
#
class UmbilicalClient
  attr_accessor :umbilical_path
  attr_accessor :key_path

  def self.default_client
    UmbilicalClient.new(
      '/usr/local/umbilical/bin/umbilical',
      '/usr/local/umbilical/cred/umbilical-cred.json'
    )
  end

  def initialize(umbilical_path, key_path)
    unless File.exist?(umbilical_path)
      throw "umbilical が #{umbilical_path} にありません。パスを確認してください"
    end
    unless File.exist?(key_path)
      throw "umblical key file が #{key_path} にありません。パスを確認してください"
    end
    @umbilical_path = umbilical_path
    @key_path = key_path
  end

  def database(path, data = nil)
    if data.nil?
      result = `#{@umbilical_path} database --key_file_path #{@key_path} --path #{path}`.strip
      result = '{}' if result == 'null'
      return result
    end
    `#{@umbilical_path} database --key_file_path #{@key_path} --path #{path} --data '#{data}'`
  end

  def push(path, data)
    `#{@umbilical_path} push --key_file_path #{@key_path} --path #{path} --data '#{data}'`.strip
  end

  def increment_build_number(repo_id)
    `#{@umbilical_path} build-number --key_file_path #{@key_path} --repo_id #{repo_id} --increment`
  end
end

# Firebase に格納されている repository_id のデータを取得します
# [repository, auth_user, artifact]
def firebase_repositories_data(logger, umbilical, repository_id, build_number)
  repository_ref = "repositories/#{repository_id}"
  logger.debug { "firebase から #{repository_ref} を取得します" }
  repository = JSON.parse(umbilical.database(repository_ref))
  auth_id_ref = "users/#{repository['token_auth_id']}"
  logger.debug { "firebase から #{auth_id_ref} を取得します" }
  auth_user = JSON.parse(umbilical.database(auth_id_ref))
  artifact_ref = "artifacts/#{repository_id}/#{build_number}"
  logger.debug { "firebase から #{artifact_ref} を取得します" }
  artifact = JSON.parse(umbilical.database(artifact_ref))
  [repository, auth_user, artifact]
end
