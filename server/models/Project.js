const mongoose = require('mongoose')
const Schema = mongoose.Schema

const dev = process.env.NODE_ENV === 'dev' ? 'test' : ''

let projectSchema = new Schema({
    name: String,
    authorizedUsers: [String],
    voxels: [{type: Schema.Types.ObjectId, ref: 'Voxel'}],
}, {collection: dev + 'VoxelyProjects'})

module.exports = mongoose.model('Project', projectSchema)
