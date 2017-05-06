const config = require('./config.js').server
const express = require('express')
const router = express.Router()
const User = require('./models/User').user

let isAuthenticated = function(req, res, next) {

	if (req.isAuthenticated()) {
		return next()
    }
	res.redirect('/guest')

}

module.exports = function(passport, nev, devEnv, local) {

	router.get('/login', function(req, res) {

		res.render('components/login', {
			dev: devEnv,
			loginFormData: req.session.loginFormData,
			signupFormData: req.session.signupFormData,
			constraints: config.loginForm,
			signup: req.session.signupFormData || req.query.signup
		})
	})

	router.get('/guest', function(req, res) {
		req.logout()
		res.render('editor', {guest: true})
	})

	router.get('/signout', function(req, res) {
		req.logout()
		req.session.loginFormData = null
		req.session.signupFormData = null
		res.redirect('/')
	})

	router.get('/', isAuthenticated, function(req, res) {

		req.session.loginFormData = {}
		req.session.signupFormData = null

		const adminUName = local ? local.adminUName : process.env.ADMIN_UNAME
		const admin = req.user.username === adminUName

		res.render('editor', {
			user: req.user,
			dev: devEnv,
			admin: admin
		})
	})

	router.get('/:username/:projectname', function(req, res) {

		if (!req.user) return res.redirect('/')

		let pjtName = req.params.projectname
		let uname = req.user.username

		User.findOne({ username: uname })
		.populate('projects')
		.exec(function(err, user) {

			user.projects.forEach(function(project) {
				if (project.name === pjtName) console.log(project)
			})

			res.redirect('/')

		})

	})

    router.get('/verify', function(req, res) {

		const email = req.session.email
		let baseurl = req.protocol + '://' + req.get('host')

		function renderView(html) {
			res.render('verify', {
				email: email,
				dev: devEnv,
				html: html
			})
		}

		if (req.query.resend) {

			nev.resendVerificationEmail(email, function(err, userFound) {
			    if (err) {
					console.log(err)
					return next(err)
				}

			    if (userFound) {
					return renderView('<p>We\'ve resent the verification email.</p>')
				}
			    else {
					let url = baseurl + '/login'
					return renderView('<p>Sorry, your email was not found in the database. Please make a new account <a href="' + url +'">here</a>.</p>')
				}
			})

		} else {

			let url = baseurl + '/verify?resend=true'

			let html = '<p>An email verification has been sent to ' + email + '. Please click the included link to verify your email.</p>'
			html += '<p>Click <a href="' + url +'">here</a> to resend the verification.</p>'

			return renderView(html)

		}

	})

    router.get('/verified-redirect', function(req, res) {

        setTimeout(function() {

            res.render('verified_redirect', {
    			dev: devEnv
    		})

        }, 5000)

	})

    router.get('/email-verification/:url', function(req, res) {

        let url = req.params.url
        nev.confirmTempUser(url, function(err, user) {
            if (err) {
                console.log(err)
                return next(err)
            }

            if (user) {
                console.log(user.username + ' successfully verified')
                req.logIn(user, function(err) {
    				if (err) return next(err)
    				return res.redirect('/verified-redirect')
    			})
            }

            else {
                req.flash('message', 'Verification link expired!')
                res.render('components/login', {
                    dev: devEnv
                })
            }
        })
	})

	router.post('/login', function(req, res, next) {

		req.session.loginFormData = {}
		req.session.signupFormData = null

		for (let attr in req.body) {
			req.session.loginFormData[attr] = req.body[attr]
		}

		passport.authenticate('login', {
			successRedirect: '/',
			failureRedirect: '/login',
			failureFlash: true
		})(req, res, next)

	})

	router.post('/signup', function(req, res, next) {

		req.session.signupFormData = {}
		req.session.loginFormData = null

		for (let attr in req.body) {
			req.session.signupFormData[attr] = req.body[attr]
		}

		passport.authenticate('signup', function(err, user, info) {

			if (err) return next(err)
			if (!user) return res.redirect('/login')

            req.session.email = user.email
			req.logIn(user, function(err) {
				if (err) return next(err)
				return res.redirect('/verify')
			})

		})(req, res, next)
	})

	return router
}
