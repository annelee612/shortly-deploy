var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');
var mongoose = require('mongoose');


var userSchema =  mongoose.Schema({
  'username': String,
  'password': String
});

userSchema.pre('save', function(next) {
  console.log('making hash password');
  var cipher = Promise.promisify(bcrypt.hash);
  cipher(this.password, null, null).bind(this)
    .then(function(hash) {
      console.log('setting password with hash');
      console.log(hash);
      this.password = hash;
      next();
    });
});

userSchema.method('comparePassword', function(attemptedPassword, callback) {
  // if (this.password === 'Phillip') {
  //   callback(true);
  // } else {
    bcrypt.compare(attemptedPassword, this.password, function(err, isMatch) {
      callback(isMatch);
    });    
  // }
});


var User = mongoose.model('User', userSchema);


module.exports = User;


//db.knex.schema.createTable('users', function (user) {
//       user.increments('id').primary();
//       user.string('username', 100).unique();
//       user.string('password', 100);
//       user.timestamps();
//     })


// = db.Model.extend({
//   tableName: 'users',
//   hasTimestamps: true,
//   initialize: function() {
//     this.on('creating', this.hashPassword);
//   },
//   comparePassword: function(attemptedPassword, callback) {
//     bcrypt.compare(attemptedPassword, this.get('password'), function(err, isMatch) {
//       callback(isMatch);
//     });
//   },
//   hashPassword: function() {
//     var cipher = Promise.promisify(bcrypt.hash);
//     return cipher(this.get('password'), null, null).bind(this)
//       .then(function(hash) {
//         this.set('password', hash);
//       });
//   }
// });