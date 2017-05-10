const mongoose = require('mongoose')
const Schema = mongoose.Schema

const dev = process.env.NODE_ENV === 'dev' ? 'test' : ''

let userSchema = new Schema({
    username: {type: String, unique: true, required: true},
    password: {type: String, required: true},
    projects: [{type: Schema.Types.ObjectId, ref: 'Project'}]
}, {collection: dev + 'users'})

module.exports = mongoose.model('User', userSchema)
