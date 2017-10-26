def create_environment_array(environments, &value_decoder)
  environments.map do |_, value|
    env_name = value['name']
    env_value = value_decoder.call(value['value'])
    "#{env_name}=#{env_value}"
  end
end
