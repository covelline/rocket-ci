require 'logger'
require 'pathname'
#
#  ログローテーションの際にファイル名の番号をインクリメントさせることを想定した
#
#
class IncrementRotationLoggerDevice < Logger::LogDevice
  attr_accessor :current_age
  def shift_log_age
    @current_age ||= -1
    File.rename(@filename.to_s, "#{@filename}.#{@current_age + 1}")
    @dev.close
    @dev = create_logfile(@filename)
    @current_age += 1
    true
  end
end

#
# ビルド用のログに関するメソッド
#
module BuildLogger
  class << self
    def new_logger(logdev: default_log_dev, shift_size: 1 * 1024 * 1024)
      logger = Logger.new(logdev, 0, shift_size)
      shift_period_suffix = '%Y%m%d'
      logger.instance_eval do
        @logdev = IncrementRotationLoggerDevice.new(logdev,
                                                    shift_age: 1, # shift_log_age を呼ぶために 0 より大きい値にする必要がある
                                                    shift_size: shift_size,
                                                    shift_period_suffix: shift_period_suffix)
      end
      logger
    end

    def default_log_dev
      default_log_directory + '/' + default_log_file
    end

    def default_log_directory
      '/opt/build_log'
    end

    def default_log_file
      'log.txt'
    end

    def log_files(log_dir: default_log_directory, log_file: default_log_file)
      list = Dir.glob("#{Pathname(log_dir)}/#{Pathname(log_file)}.*").sort_by do |file|
        file_name = File.basename(file)
        num = file_name.split('.').last.to_i
        num
      end
      log_file = "#{Pathname(log_dir)}/#{Pathname(log_file)}"
      list << log_file if File.exist?(log_file)
      list
    end
  end
end
