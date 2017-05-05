const _ = require('lodash')

const sharedConfig = {
    maxVoxelHeight: 75,
    actionDelay: 100, // ms
    maxGlobalBlocks: 5000
}

const serverConfig = {
    dataChunkSize: 15000, // keys
    chunkInterval: 50, // ms
    maxClients: 1000,
    loginForm: {
        lowMaxLength: 20,
        highMaxLength: 40,
        minLength: 8
    }
}

// each set much be contanined within
// an object for generation to work properly
const clientConfig = {
    general: {
        maxVoxelHeight: serverConfig.maxVoxelHeight,
        actionDelay: serverConfig.actionDelay,
        chatDelay: serverConfig.chatDelay,
        deleteOtherDelay: serverConfig.deleteOtherDelay,
        aaOnByDefault: true
    },
    convert: {
        warnThreshold: 15000,
        errorThreshold: 30000
    },
    grid: {
        blockSize: 50, // even
        sqPerSideOfGrid: 50, // even, +1
        init: function() {

            // scene size of the grid; must be even
            this.size = this.sqPerSideOfGrid * (this.blockSize / 2)

            return this
        }
    }.init(),

    mapControls: {
        // these two are not really
        // used, look into removing
        minDistance: 0,
        maxDistance: Number.MAX_VALUE,
        // cam position constraints
        camMinxz: -100000,
        camMaxxz: 100000,
        camMiny: 100,
        camMaxy: 75000,
        // cam rotation / zoom speed
        rotateSpeed: 0.5,
        zoomSpeed: 1.0,
        // How far you can orbit vertically, upper and lower limits.
        minPolarAngle: 0.05, // radians
        maxPolarAngle: Math.PI / 2.1 // radians
    },

    GUI: {
        maxSavedColors: 5
    }
}

_.merge(serverConfig, sharedConfig)
_.merge(clientConfig.general, sharedConfig)

serverConfig.minXZ = -(clientConfig.grid.sqPerSideOfGrid / 2)
serverConfig.maxXZ = (clientConfig.grid.sqPerSideOfGrid / 2)

module.exports = {
    server: serverConfig,
    client: clientConfig
}
