const Project = require('./models/Project')
const User = require('./models/User').user
const Voxel = require('./models/Voxel')
const responses = require('./socketResponses.js')

let users = {}

function getFuncName(funcCallee) {

	let name = funcCallee.toString()
	name = name.substr('function '.length)
	name = name.substr(0, name.indexOf('('))

	return name

}

function errLog(err, funcCallee) {
	console.log('Error in ' + getFuncName(funcCallee))
	console.log(err)
}

module.exports = {

	test: function() {

		let project = new Project({
			name: 'whatever',
			authorizedUsers: [],
			voxels: []
		})

		users['oBsceni9ty'].projects.push(project)
		users['oBsceni9ty'].save()

	},

	isConnected: function(uname) {
		return (uname in users)
	},

	removeUserCache: function(uname) {

		if (uname in users) {

			users[uname] = null
			delete users[uname]

		}

	},

	getUserCache: function(uname) {
		return users[uname]
	},

	cacheUser: function(uname, /* optional */ sockid, cb) {

		User.findOne({
				username: uname
			})
			.populate({
				path: 'projects',
				populate: {
					path: 'voxels',
					model: 'Voxel'
				}
			})
			.exec(function(err, user) {

				if (err) {
					errLog(err, arguments.callee)
					return cb(err)
				}

				if (!user) {
					errLog('user ' + uname + ' does not exist', arguments.callee)
					return cb(responses.noExist)
				}

				users[user.username] = user
				users[user.username].sockid = sockid

				return cb(null)

			})
	},

	deleteProject: function(uname, pjtName, cb) {
		let user = users[uname]

		if (user) {

			let projects = user.projects

			for (let i = 0; i < projects.length; i++) {

				let project = projects[i]

				if (project.name === pjtName) {

					Project.findOne({ _id: project._id })
						.remove()
						.exec(function(err) {

						if (err) {
							errLog(err, arguments.callee)
							return cb(err)
						}

						user.save(function(err) {
							if (err) {
								errLog(err, arguments.callee)
								return cb(err)
							}
							projects.splice(i, 1)

							return cb(null)
						})
					})
					break
				}
			}
		} else {
			errLog('user cache not found', arguments.callee)
			return cb('user cache not found')
	},

	createProject: function(uname, pjtName, cb) {

		let user = users[uname]

		if (user) {

			project.save(function(err) {

				if (err) {
					errLog(err, arguments.callee)
					return cb(err)
				}

				let project = new Project({
					name: pjtName,
					authorizedUsers: [],
					voxels: []
				})
				user.projects.push(project)

						return cb(null)
					})
				user.save(function(err) {
					if (err) {
						errLog(err, arguments.callee)
						return cb(err)
					}
				})

			})

		} else {
			errLog('user cache not found', arguments.callee)
			return cb('user cache not found')
		}
	}
}
