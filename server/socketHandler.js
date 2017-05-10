const config = require('./config.js').server
const responses = require('./socketResponses.js')
const userMgr = require('./userMgr.js')

const actionDelay = {}
const connectedUsers = {}

let worldData

let i = 0

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

    socket.on('batch delete', function(toDelete, done) {

        worldData.batchDelete(toDelete, function(deletedVoxels) {

            for (var i = 0; i < deletedVoxels.length; i++) {
                socket.broadcast.emit('block removed', deletedVoxels[i])
            }

            done(deletedVoxels)

        })

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

}

function handleChunking(socket) {

    // the client told us its ready for the
    // data, so send it
    socket.on('start chunking', function() {

        console.log('chunking')

        // prep for chunking by adding all
        // keys to an array
        let keys = []
        for (let key in worldData.voxels) {
            if (worldData.voxels.hasOwnProperty(key))
                keys.push(key)
        }

        let chunk
        let chunkSize = config.dataChunkSize,
            kLen = keys.length // total data length

        // tell the client what they're about to receive
        socket.emit('chunking size', Math.ceil(kLen / chunkSize))

        let i = 0,
            j

        // send chunks in delayed isntervals
        let interval = setInterval(function() {

            chunk = ''
            j = 0

            // construct this chunk and send it
            for (i, j; i < kLen, j < chunkSize; i++, j++) {

                if (i === kLen) break

                // format it in JSON so it can be
                // parsed by JSON.parse
                let obj = worldData.voxels[keys[i]]
                chunk += '"' + keys[i] + '"' + ':' + JSON.stringify(obj)

                if (i !== kLen - 1) chunk += ','
            }

            // send the chunk
            socket.emit('chunk', chunk)

            // we're done
            if (i > kLen - 1) {
                clearTimeout(interval)
                socket.emit('chunk done')
            }

        }, config.chunkInterval)

    })

}

function IOHandler(io, _worldData) {

    worldData = _worldData

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
        }

        handleBlockOperations(socket, io)
        handleChunking(socket)

        // client disconnected
        socket.on('disconnect', function() {

            //userMgr.removeUserCache(uname)

            console.log('connections: ' + io.engine.clientsCount)

        })

    })

}

module.exports = IOHandler
