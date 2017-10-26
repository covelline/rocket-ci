"use strict:";
/* eslint-disable no-console */
module.exports = function(config) {
  config;

  this.authenticate = (options) => {
    options;
  };
  this.pullRequests = {};
  this.pullRequests.get = (options, callback) => {
    callback(null, {
      head: {
        repo: {
          owner: {
            login: "head"
          },
          name: "name"
        },
        sha: "sha"
      },
      base : {
        repo: {
          owner: {
            login: "login"
          },
          name: "name"
        }
      }
    });
  };

  this.repos = {};
  this.repos.createStatus = (options, callback) => {
    callback(null);
  };
};
