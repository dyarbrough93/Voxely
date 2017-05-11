const config = require('./config.js').server
const responses = require('./socketResponses.js')
const userMgr = require('./userMgr.js')

let actionDelay = {}
let tempUsers = {}

function enoughTimePassed(socket) {

    const uname = socket.request.user.username
    const actDelayKey = uname ? uname : socket.id // guest
    const delay = (function() {
        return config.actionDelay
    })()

    // only allow add if user hasn't
    // added for delayObj
    if (actionDelay[actDelayKey]) {
        let msPassed = (new Date() - actionDelay[actDelayKey])
        if (msPassed < delay) return false
        actionDelay[actDelayKey] = new Date()
        return true
    } else {
        actionDelay[actDelayKey] = new Date()
        return true
    }

}

function handleBlockOperations(socket, io) {

    // handle block add
    socket.on('block added', function(block, pjtName, callback) {

        if (!enoughTimePassed(socket)) return callback(responses.needDelay)

        let uname = socket.request.user.username

        // try to add the block
        let res = userMgr.addBlockToProj(block, uname, pjtName)
        if (res) return callback(responses.success)
        return callback(res)

    })

    // handle block remove
    socket.on('block removed', function(gPos, pjtName, callback) {

        if (!enoughTimePassed(socket)) return callback(responses.needDelay)

        let uname = socket.request.user.username
        if (!uname) uname = 'Guest'

        // try to remove the block
        let res = userMgr.removeBlockFromProj(gPos, uname, pjtName)
        if (res) return callback(responses.success)
        return callback(res)

    })

    socket.on('save project', function(pjtName, done) {

        let uname = socket.request.user.username
        if (!uname || uname === 'Guest') return done('guest')

        userMgr.saveProject(uname, pjtName, done)

    })

    socket.on('get projects', function(done) {

        let uname = socket.request.user.username
        if (!uname || uname === 'Guest') return done('guest')

        let userCache = userMgr.getUserCache(uname)
        if (userCache) return done(userCache.projects)
        return done([])

    })

    socket.on('create project', function(pjtName, voxels, done) {

        let uname = socket.request.user.username
        if (!uname || uname === 'Guest') return done('guest')

        userMgr.createProject(uname, pjtName, voxels, done)

    })

    socket.on('cache temp user', function(uname, voxels) {

        tempUsers[uname] = voxels

    })

}

function IOHandler(io) {

    // new connection
    io.on('connection', function(socket) {

        // disconnect when too many users
        /*if (io.engine.clientsCount > config.maxClients) {
            socket.emit('max clients')
            socket.disconnect()
            return
        }*/

        console.log('connections: ' + io.engine.clientsCount)

        let uname = socket.request.user.username

        if (uname) {
            userMgr.cacheUser(uname, socket.id, function(err) {
                if (err) console.log(err)
            })
            if (tempUsers[uname]) {
                socket.emit('load temp cache', tempUsers[uname])
                delete tempUsers[uname]
            }
        }

        handleBlockOperations(socket, io)

        // client disconnected
        socket.on('disconnect', function() {

            //userMgr.removeUserCache(uname)

            console.log('connections: ' + io.engine.clientsCount)

        })

    })

}

module.exports = IOHandler
