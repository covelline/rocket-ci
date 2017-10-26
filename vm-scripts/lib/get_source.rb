require 'json'
require 'uri'
require 'fileutils'

Dir[File.dirname(__FILE__) + '/lib/*.rb'].each { |file| require file }

def get_source(logger, private_key, pull_request, artifact)
  FileUtils.mkdir_p('/root/.ssh')
  File.write('/root/.ssh/id_rsa', private_key)
  FileUtils.chmod_R(0o600, '/root/.ssh')
  src_dir = '/opt/src'
  base_url = pull_request['base']['repo']['ssh_url']
  base_sha = pull_request['base']['sha']
  head_sha = artifact['hash']

  command = <<EOF
set -x
ssh-keyscan github.com >> /root/.ssh/known_hosts
git init #{src_dir}
cd #{src_dir}
git config user.email "rocket@covelline.com"
git config user.name "rocket"
git remote add origin #{base_url}
git config --add remote.origin.fetch '+refs/heads/*:refs/remotes/origin/*'
git config --add remote.origin.fetch '+refs/pull/*/head:refs/remotes/origin/pr/*'
git fetch origin --tags --progress
git checkout #{base_sha}
git merge --no-ff --no-commit #{head_sha}
EOF

  logger.info { command }
  result = `#{command}`
  logger.info { result }

rescue => e
  puts e
ensure
  FileUtils.rm_f('/root/.ssh/id_rsa')
end
