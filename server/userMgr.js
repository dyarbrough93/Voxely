const Project = require('./models/Project')
const User = require('./models/User')
const Voxel = require('./models/Voxel')
const responses = require('./socketResponses.js')

let users = {}

module.exports = {

	test: function() {
	},

	isConnected: function(uname) {
		return (uname in users)
	},

	removeUserCache: function(uname) {

		console.log('remove cache')

		if (uname in users) {

			users[uname] = null
			delete users[uname]

		}

	},

	removeBlockFromProj: function(gPos, uname, pjtName) {
		let user = users[uname]

		if (user) {

			let projects = user.projects
			for (let i = 0; i < projects.length; i++) {
				let project = projects[i]
				if (project.name === pjtName) {

					let voxels = project.voxels
					for (var j = 0; j < voxels.length; j++) {
						let voxel = voxels[j]
						if (!voxel || !voxel.position) {
							console.log('voxel undefined')
							continue
						}
						if (voxel.position.x === gPos.x &&
							voxel.position.y === gPos.y &&
							voxel.position.z === gPos.z) {

								Voxel.findOne({ _id: voxel._id })
									.remove().exec()

								voxels.splice(j, 1)

								project.save()

								return true
							}
					}
					console.log('voxel not found')
					return false
				}
			}
			console.log('no matching project found')
			return false
		}
		else {
			console.log('user cache not found')
			return false
		}
	},

	addBlockToProj: function(block, uname, pjtName) {

		let user = users[uname]

		if (user) {

			let projects = user.projects
			for (let i = 0; i < projects.length; i++) {
				let project = projects[i]
				if (project.name === pjtName) {
					let vox = new Voxel({
						position: block.position,
						color: block.color
					})
					project.voxels.push(vox)

					vox.save() // no err check

					project.save()

					return true
				}
			}

			console.log('no matching project found')
			return false

		} else {
			console.log('user cache not found')
			return false
		}

	},

	getUserCache: function(uname) {
		return users[uname]
	},

	cacheUser: function(uname, /* optional */ sockid, cb) {

		if (users[uname]) {
			if (sockid) users[uname].sockid = sockid
			return cb(null)
		}

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
					console.log(err, arguments.callee)
					return cb(err)
				}

				if (!user) {
					console.log('user ' + uname + ' does not exist', arguments.callee)
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
							console.log(err, arguments.callee)
							return cb(err)
						}

						user.save(function(err) {
							if (err) {
								console.log(err, arguments.callee)
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
			console.log('user cache not found', arguments.callee)
			return cb('user cache not found')
		}

	},

	createProject: function(uname, pjtName, voxels, cb) {

		if (!pjtName) {
			return cb(responses.noProjName)
		}

		let user = users[uname]

		if (user) {

			for (let i = 0; i < user.projects.length; i++) {
				if (user.projects[i].name === pjtName)
					return cb(responses.duplicateProj)
			}

			let project = new Project({
				name: pjtName,
				authorizedUsers: [],
				voxels: []
			})

			if (voxels) {

				for (let i = 0; i < voxels.length; i++) {
					let newVoxel = new Voxel(voxels[i])
					project.voxels.push(newVoxel)
					newVoxel.save(function(err) { if (err) console.log(err) })
				}

			}

			project.save(function(err) {

				if (err) {
					console.log(err, arguments.callee)
					return cb(err)
				}

				Project.populate(project, { path: 'voxels' }, function(err, popProject) {

					if (err) console.log(err)

					user.projects.push(popProject)

					user.save(function(err) {
						if (err) {
							console.log(err, arguments.callee)
							return cb(err)
						}
						return cb(null)
					})
				})
			})

		} else {
			console.log('user cache not found', arguments.callee)
			return cb(responses.unexpectedErr)
		}
	}
}
