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
		_id: mongoProject._id,
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

	// @TODO: rewrite this disgusting mess
	saveProject(uname, pjtName, cb) {

		let userCache = users[uname]

		if (userCache) {
			let projects = userCache.projects
			for (let i = 0; i < projects.length; i++) {
				let project = projects[i]
				if (project.name === pjtName) {
					Project.findOne({ _id: project._id }, function(err, mProject) {
						if (err) return cb(err)

						let voxels = project.voxels
						let toAdd = []
						let toRemove = []
						for (let j = 0; j < voxels.length; j++) {

							let voxel = voxels[j]
							if (voxel.needsUpdate) {

								if (voxel.operation === 'add') {

									let vox = new Voxel({
										position: voxel.position,
										color: voxel.color
									})

									mProject.voxels.push(vox._id)
									toAdd.push({ addVox: vox, cachedVox: voxel })

								}
								else if (voxel.operation === 'remove') {

									// we should have the id here
									mProject.voxels.pull(voxel._id)
									toRemove.push(voxel)

								}
								else console.log('voxel.operation undefined or unrecognized')
							}
						}

						let addDone = false
						let removeDone = true

						function trySave() {

							if (!addDone || !removeDone) return

							for (let k = voxels.length - 1; k >= 0; k--) {
								if (voxels[k].spliceMe) voxels.splice(k, 1)
							}

							mProject.save(function(err) {
								if (err) return cb(err)
								User.findOne({ username: uname }, function(err, user) {
									if (err) return cb(err)

									if (user.projects.indexOf(mProject._id) === -1) {
										user.projects.push(mProject)
										user.save(function(err) {
											return cb(err)
										})
									} else {
										return cb(null)
									}
								})
							})
						}

						if (!toAdd.length) {
							addDone = true
							trySave()
						} else {
							let numAdded = 0
							toAdd.forEach(function(voxPair) {

								let addVox = voxPair.addVox
								let cachedVox = voxPair.cachedVox

								addVox.save(function(err) {
									if (err) return cb(err)
									else {
										cachedVox._id = addVox._id
										cachedVox.needsUpdate = false
										cachedVox.operation = null
									}
									numAdded++
									if (numAdded === toAdd.length) {
										addDone = true
										trySave()
									}
								})
							})
						}

						if (!toRemove.length) {
							removeDone = true
							trySave()
						} else {
							let numRemoved = 0
							toRemove.forEach(function(cachedVox) {

								Voxel.remove({ _id: cachedVox._id }, function(err) {
									if (err) return cb(err)
									else {
										cachedVox.spliceMe = true
									}
									numRemoved++
									if (numRemoved === toRemove.length) {
										removeDone = true
										trySave()
									}
								})
							})
						}
					})
					break
				}
			}
		}
		else {
			console.log('user cache not found')
			return cb(false)
		}
	},

	removeBlockFromProj: function(gPos, uname, pjtName) {

		let userCache = users[uname]

		if (userCache) {

			let projects = userCache.projects
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

							if (voxel.needsUpdate) {

								// hasn't been saved yet, just remove
								// from temp arr
								if (voxel.operation === 'add') {
									voxels.splice(j, 1)
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

		let userCache = users[uname]

		if (userCache) {

			let projects = userCache.projects
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

				console.log(user)

				users[user.username] = copyMongoUser(user)
				users[user.username].sockid = sockid

				console.log(users[user.username])

				return cb(null)

			})
	},

	deleteProject: function(uname, pjtName, cb) {

		let userCache = users[uname]

		if (userCache) {

			let projects = userCache.projects

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

		let userCache = users[uname]

		if (userCache) {

			for (let i = 0; i < userCache.projects.length; i++) {
				if (userCache.projects[i].name === pjtName)
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

					userCache.projects.push(copyMongoProject(popProject))

					return cb(null)

				})
			})

		} else {
			console.log('user cache not found')
			return cb(responses.unexpectedErr)
		}
	}
}
