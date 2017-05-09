const config = require('./config.js').server
const express = require('express')
const router = express.Router()
const userMgr = require('./userMgr.js')
const User = require('./models/User')
const Project = require('./models/Project')

module.exports = function(passport, devEnv, local) {

	router.get('/test', function() {

		userMgr.test()

	})

	router.get('/', function(req, res) {

		if (req.isAuthenticated())
			return res.redirect('/user/' + req.user.username)

		return res.render('editor', {
			dev: devEnv,
			constraints: config.loginForm
		})

	})

	router.get('/signout', function(req, res) {
		req.logout()
		req.session.loginFormData = null
		req.session.signupFormData = null
		res.redirect('/')
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
			dev: devEnv,
			constraints: config.loginForm
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
						project: JSON.stringify(project),
						constraints: config.loginForm
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
				return res.redirect('/') // @TODO: save voxels
			})

		})(req, res, next)
	})

	return router
}
