const mongoose = require('mongoose')
const Schema = mongoose.Schema

const dev = process.env.NODE_ENV === 'dev' ? 'test' : ''

let projectSchema = new Schema({
    pid: String,
    authorizedUsers: [String],
    voxels: [{type: Schema.Types.ObjectId, ref: 'Voxel'}],
    public: Boolean
}, {collection: dev + 'projects'})

module.exports = mongoose.model('Project', projectSchema)
