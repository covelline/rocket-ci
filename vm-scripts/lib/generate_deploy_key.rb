require 'sshkey'

def generate_deploy_key
  return SSHKey.generate
end