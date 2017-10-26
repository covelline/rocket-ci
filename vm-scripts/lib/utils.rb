require 'open3'

def run_command(logger, command)
  logger.debug { "#{command} を実行します" }
  out, err, status = Open3.capture3(command)
  unless status.success?
    logger.debug { "#{command} に失敗しました" }
    throw Exception.new(err)
  end
  [out, status]
end
