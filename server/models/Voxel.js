const mongoose = require('mongoose')
const Schema = mongoose.Schema

const dev = process.env.NODE_ENV === 'dev' ? 'test' : ''

let dataSchema = new Schema({
    key: String,
    data: {
        c: Number, // color
        username: String // creator
    }
}, {collection: dev + 'worldData'})

module.exports = mongoose.model('Voxel', dataSchema)