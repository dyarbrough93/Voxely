const Project = require('./models/Project')
const User = require('./models/User').user

module.exports = {

	getProjects: function(uname, cb) {

		User.findOne({
				username: uname
			})
			.populate('projects')
			.exec(function(err, user) {
				if (err) return cb(err)
				return cb(null, user.projects)
			})
	},

	createProject: function(uname, pjtName, cb) {

		User.findOne({
				username: uname
			}).populate('projects')
			.exec(function(err, user) {
				if (err) return cb(err)

				for (let i = 0; i < user.projects.length; i++) {
					if (user.projects[i].name === pjtName) return cb('duplicate name')
				}

				let project = new Project({
					name: pjtName,
					authorizedUsers: [],
					voxels: []
				})

				project.save(function(err2) {
					if (err2) return cb(err2)
					user.projects.push(project.id)
					user.save(function(err3) {
						if (err3) return cb(err3)
						return cb(null)
					})
				})
			})
	}
}
