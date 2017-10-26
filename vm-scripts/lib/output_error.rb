def output_error(error)
    puts "Build failed, virtual machine will shutdown"
    puts error
    puts error.backtrace # TODO エラーログを出力する方法を決定する
end
