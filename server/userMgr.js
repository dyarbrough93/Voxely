const Project = require('./models/Project')
const User = require('./models/User')
const Voxel = require('./models/Voxel')
const responses = require('./socketResponses.js')

let users = {}

function vec3Eq(vec1, vec2) {
	return vec1.x === vec2.x &&
		   vec1.y === vec2.y &&
		   vec1.z === vec2.z
}

function copyMongoProject(mongoProject) {
	return {
		name: mongoProject.name,
		authorizedUsers: [],
		voxels: (function() {
			let voxels = []
			mongoProject.voxels.forEach(function(voxel) {
				voxels.push({
					position: voxel.position,
					color: voxel.color
				})
			})
			return voxels
		})()
	}
}

function copyMongoUser(mongoUser) {
	return {
		projects: (function() {
			let projects = []
			mongoUser.projects.forEach(function(project) {
				projects.push(copyMongoProject(project))
			})
			return projects
		})()
	}
}

module.exports = {

	test: function() {

		users['oBsceni9ty'].projects.forEach(function(project) {
			if (project.name === 'dfsdf') {
				let vox = new Voxel({
					position: {x:0,y:0,z:0},
					color: 0
				})
				project.voxels.push(vox)
				console.log(project.voxels)
			}
		})
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

						if (vec3Eq(voxel.position, gPos)) {

							console.log(voxel)

							if (voxel.needsUpdate) {

								// hasn't been saved yet, just remove
								// from temp arr
								if (voxel.operation === 'add') {
									voxels.splice(j, 1)
									console.log(voxels)
									return true
								}
								else if (voxel.operation === 'remove')
									return false // already flagged for removal
							}

							else {
								// already saved in db,
								// flag for removal
								voxel.needsUpdate = true
								voxel.operation = 'remove'

								console.log(voxels)

								return true
							}
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

					let voxels = project.voxels

					// check if voxel already exists
					for (let j = 0; j < voxels.length; j++) {
						if (vec3Eq(block.position, voxels[j].position)) {
							return false
						}
					}

					// voxel doesn't exist
					project.voxels.push({
						needsUpdate: true,
						operation: 'add',
						position: block.position,
						color: block.color
					})

					console.log(project.voxels)

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
					console.log(err)
					return cb(err)
				}

				if (!user) {
					console.log('user ' + uname + ' does not exist')
					return cb(responses.noExist)
				}

				users[user.username] = copyMongoUser(user)
				users[user.username].sockid = sockid

				console.log(users[user.username])
				console.log(users[user.username].voxels)

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
							console.log(err)
							return cb(err)
						}

						user.save(function(err) {
							if (err) {
								console.log(err)
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
			console.log('user cache not found')
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
					console.log(err)
					return cb(err)
				}

				Project.populate(project, { path: 'voxels' }, function(err, popProject) {

					if (err) console.log(err)

					user.projects.push(copyMongoProject(popProject))

					return cb(null)

				})
			})

		} else {
			console.log('user cache not found')
			return cb(responses.unexpectedErr)
		}
	}
}
