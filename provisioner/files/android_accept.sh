#!/usr/bin/expect -f

set timeout 1800

spawn {*}$argv
expect {
  "Do you accept the license '*'*" {
        exp_send "y\r"
        exp_continue
  }
  eof
}
