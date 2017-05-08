const config = require('./config.js').server
const express = require('express')
const router = express.Router()
const userMgr = require('./userMgr.js')
const User = require('./models/User').user
const Project = require('./models/Project')

module.exports = function(passport, nev, devEnv, local) {

	router.get('/test', function() {

		userMgr.test()

	})

	router.get('/', function(req, res) {

		if (req.isAuthenticated())
			return res.redirect('/user/' + req.user.username)

		return res.render('editor', {
			dev: devEnv
		})

	})

	router.get('/signout', function(req, res) {
		req.logout()
		req.session.loginFormData = null
		req.session.signupFormData = null
		res.redirect('/')
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
				} else {
					let url = baseurl + '/login'
					return renderView('<p>Sorry, your email was not found in the database. Please make a new account <a href="' + url + '">here</a>.</p>')
				}
			})

		} else {

			let url = baseurl + '/verify?resend=true'

			let html = '<p>An email verification has been sent to ' + email + '. Please click the included link to verify your email.</p>'
			html += '<p>Click <a href="' + url + '">here</a> to resend the verification.</p>'

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
			} else {
				req.flash('message', 'Verification link expired!')
				res.render('components/login', {
					dev: devEnv
				})
			}
		})
	})

	router.get('/user/:username', function(req, res) {

		if (!req.user || req.user.username !== req.params.username) return res.redirect('/')

		// clear form data
		req.session.loginFormData = {}
		req.session.signupFormData = null

		const adminUName = devEnv ? local.adminUName : process.env.ADMIN_UNAME
		const admin = req.user.username === adminUName

		return res.render('editor', {
			user: req.user,
			dev: devEnv
		})

	})

	router.get('/user/:username/:projectname', function(req, res) {

		if (!req.user || req.user.username !== req.params.username) return res.redirect('/')

		let pjtName = req.params.projectname
		let uname = req.user.username

		let userCache = userMgr.getUserCache(uname)
		if (userCache) {
			let projects = userCache.projects
			for (let i = 0; i < projects.length; i++) {
				let project = projects[i]
				if (project.name === pjtName) {
					return res.render('editor', {
						user: req.user,
						dev: devEnv,
						project: JSON.stringify(project)
					})
				}
			}
			// project not found
			return res.redirect('/user/' + uname)
		} else {
			console.log('user cache for ' + uname + ' not found')
			res.redirect('/')
		}
	})

	router.get('/user/:username/delete/:projectname', function(req, res) {

		if (!req.user || req.user.username !== req.params.username) return res.redirect('/')

		let pjtName = req.params.projectname
		let uname = req.user.username

		userMgr.deleteProject(uname, pjtName, function(err) {

			if (err) console.log(err)

			return res.redirect('/')

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
			failureRedirect: '/',
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
			if (!user) return res.redirect('/')

			req.session.email = user.email
			req.logIn(user, function(err) {
				if (err) return next(err)
				return res.redirect('/verify')
			})

		})(req, res, next)
	})

	return router
}
