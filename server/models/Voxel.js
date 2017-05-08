const mongoose = require('mongoose')
const Schema = mongoose.Schema

const dev = process.env.NODE_ENV === 'dev' ? 'test' : ''

let dataSchema = new Schema({
    position: {
        x: Number,
        y: Number,
        z: Number
    },
    color: Number
}, {collection: dev + 'voxels'})

module.exports = mongoose.model('Voxel', dataSchema)
