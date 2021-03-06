var request = require('request');
var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var util = require('../lib/utility');

var db = require('../app/config');
var User = require('../app/models/user');
var Link = require('../app/models/link');
var Users = require('../app/collections/users');
var Links = require('../app/collections/links');
var mongoose = require('mongoose');
var mongoAddress = 'mongodb://localhost/shortly';
mongoose.Promise = Promise;
mongoose.connect(mongoAddress);
var db = mongoose.connection;
db.on('error', console.error);

exports.renderIndex = function(req, res) {
  res.render('index');
};

exports.signupUserForm = function(req, res) {
  res.render('signup');
};

exports.loginUserForm = function(req, res) {
  res.render('login');
};

exports.logoutUser = function(req, res) {
  req.session.destroy(function() {
    res.redirect('/login');
  });
};

exports.fetchLinks = function(req, res) {
  Links.reset().find().then(function(links) {
    res.status(200).send(links.models);
  });
};

exports.saveLink = function(req, res) {
  var uri = req.body.url;
  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

  Link.findOne({ url: uri }).then(function(found) {
    console.log(found);
    if (found) {
      res.status(200).send(found);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.sendStatus(404);
        }
        console.log(uri, 'uri 2');

        var newLink = new Link({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        });
        newLink.save().then(function(newLink) {
          res.status(200).send(newLink);
        });
      });
    }
  });
};

exports.loginUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  User.findOne({ username: username })
    .then(function(user) {
      if (!user) {
        res.redirect('/login');
      } else {
        console.log(user.comparePassword);
        user.comparePassword(password, function(match) {
          console.log('match', match);
          if (match) {
            util.createSession(req, res, user);
          } else {
            res.redirect('/login');
          }
        });
      }
    });
};

exports.signupUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  User.findOne({username: username})
    .then(function(user) {
      if (!user) {
        var newUser = new User({
          username: username,
          password: password
        });
        console.log(newUser, 'newuser');
        newUser.save()
          .then(function(newUser) {
            //util.createSession(req, res, newUser);
            req.session.regenerate(function() {
              req.session.user = newUser;
              res.redirect('/');
            });
          });
      } else {
        console.log('Account already exists');
        res.redirect('/signup');
      }
    });
};

exports.navToLink = function(req, res) {

  Link.findOne({ code: req.params[0] })
    .then(function(link) {
      if (!link) {
        res.redirect('/');
      } else {
        link.set({ visits: link.get('visits') + 1 })
          .save()
          .then(function() {
            return res.redirect(link.get('url'));
          });
      }
    });
};