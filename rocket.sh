#!/usr/bin/env bash

set -e

apt-add-repository ppa:brightbox/ruby-ng
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
apt-get install -y nodejs ruby2.3 ruby2.3-dev

node --version
pwd

#######################
# App Engine のテスト #
#######################

echo "cd to appengine"
cd appengine

npm install

echo "start eslint in appengine"
npm run lint

echo "start test in appengine"
npm test

#######################
# payment のテスト #
#######################

echo "cd to payment"
cd ../
cd payment


npm install

echo "start eslint in payment"
npm run lint

echo "start test in payment"
npm test

################
# Web のテスト #
################

echo "cd to web"
cd ../web

npm install

echo "start test in web"
npm test

######################
# vm-script のテスト #
######################

echo "cd to vm-scripts"
cd ../vm-scripts
gem install --no-rdoc --no-ri bundler
bundle install
bundle exec rake test
