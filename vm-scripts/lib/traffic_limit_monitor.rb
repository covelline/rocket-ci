require 'csv'
require 'open3'
#
#  dstat を起動してバックグラウンドでネットワーク転送量のモニタリングを行い、
# パラメータに与えた上限を超えた際には失敗としてコールバックを呼び出します
#
def traffic_limit_monitor(logger, limit)
  logger.info { "ネットワークの利用料が #{limit} を超えないように制限します" }
  monitoring = true
  Thread.new do
    pid = `dstat --output '/tmp/dstat.csv' -n -N docker0 > /dev/null & echo $!`.lstrip.chomp.to_i
    while monitoring
    end
    Process.kill(:STOP, pid)
  end
  Thread.new do
    monitor_dstat(limit) do
      logger.error { '通信料上限を超えました。ビルドを失敗として中断します.' }
      monitoring = false
      yield
    end
  end
end

def monitor_dstat(limit)
  total = 0
  open('/tmp/dstat.csv') do |f|
    while total < limit
      line = nil
      begin
        line = f.sysread(10)
      rescue
        line = nil
      end
      unless line.nil?
        traffic = _parse_line(line)
        total += traffic
      end
    end
    yield
  end
end

def _parse_line(line)
  CSV.parse(line)[0][1].to_i
rescue
  0
end
