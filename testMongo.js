const mongoose = require('mongoose')
mongoose.Promise = require('bluebird')
const mongoConnect = require('./server/MongoDb.js')
const local = require('./server/local.js')
const dbUrl = local.mongo.dbUrl

process.env.NODE_ENV = 'dev'
let Voxel = require('./server/models/Voxel')
let Project = require('./server/models/Project')
let User = require('./server/models/User')

const bCrypt = require('bcrypt-nodejs')

function clearDb(cb) {

    Voxel.remove({}, function(err) {
        if (err) console.log(err)
        else {
            console.log('voxels removed')
            Project.remove({}, function(err) {
                if (err) console.log(err)
                else {
                    console.log('projects removed')

                    User.remove({}, function(err) {
                        if (err) console.log(err)
                        else {
                            console.log('users removed')
                            let user = new User({
                                username: 'asdf',
                                password: bCrypt.hashSync('asdf', bCrypt.genSaltSync(10), null),
                                projects: []
                            })
                            user.save(function(err) {
                                if (err) console.log(err)
                                else {
                                    console.log('user asdf created')
                                    cb()
                                }
                            })
                        }
                    })
                }
            })
        }
    })
}



mongoConnect(mongoose, dbUrl, function() {

    clearDb(function() {
        console.log('cleared')
        process.exit()
    })

    /*clearDb(function() {

        let project = new Project({
            name: 'Test',
            authorizedUsers: [],
            voxels: []
        })

        project.save(function(err) {
            if (err) console.log(err)
            else {
                console.log('saved project')
                let vox = new Voxel({

                    position: { x: 0, y: 0, z: 0 },
                    color: 0

                })

                vox.save(function(err) {
                    if (err) console.log(err)
                    else {
                        console.log('saved voxel')
                        project.voxels.push(vox)
                        project.save(function(err) {
                            if (err) console.log(err)
                            else {
                                console.log('saved project')

                                Voxel.remove({ _id: vox._id }, function(err) {
                                    if (err) console.log(err)
                                    else {
                                        console.log('voxel removed')

                                        project.voxels.splice(0, 1)

                                        project.save(function(err) {
                                            if (err) console.log(err)
                                            else console.log('project saved')
                                        })
                                    }
                                })
                            }
                        })
                    }
                })
            }
        })
    })*/
})
