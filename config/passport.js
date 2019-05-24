var LocalStrategy = require("passport-local").Strategy;

var bcrypt = require('bcryptjs');

module.exports = function(passport, connection) {
    passport.serializeUser(function(user, done) {
        done(null, user.id, user.isAdmin);
    });

    passport.deserializeUser(function(id, done) {
        connection.query("SELECT * FROM user_account WHERE id = ? ", [id],
            function(err, rows) {
                done(err, rows[0]);
            });
    });

    passport.use(
        'local-signup',
        new LocalStrategy({
                usernameField: 'username',
                passwordField: 'password',
                passReqToCallback: true
            },
            function(req, username, password, done) {
                connection.query("SELECT * FROM user_account WHERE username = ? ",
                    [username],
                    function(err, rows) {
                        if (err)
                            return done(err);
                        if (rows.length) {
                            return done(null, false, req.flash('signupMessage', 'That is already taken'));
                        } else {
                            var newUserMysql = {
                                username: username,
                                password: bcrypt.hashSync(password, null, null)
                            };

                            var insertQuery = "INSERT INTO user_account (username, password) values (?, ?)";

                            connection.query(insertQuery, [newUserMysql.username, newUserMysql.password],
                                function(err, rows) {
                                    newUserMysql.id = rows.insertId;

                                    return done(null, newUserMysql);
                                });
                        }
                    });
            })
    );

    passport.use(
        'local-login',
        new LocalStrategy({
                usernameField: 'username',
                passwordField: 'password',
                passReqToCallback: true
            },
            function(req, username, password, done) {
                connection.query("SELECT * FROM user_account WHERE username = ? ", [username],
                    function(err, rows) {
                        if (err)
                            return done(err);
                        if (!rows.length) {
                            return done(null, false, req.flash('loginMessage', 'No User Found'));
                        }
                        if (!bcrypt.compareSync(password, rows[0].password))
                            return done(null, false, req.flash('loginMessage', 'Wrong Password'));
                        return done(null, rows[0]);
                    });
            })
    );
};
