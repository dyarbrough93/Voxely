'use strict'

/**
 * Manages socket events
 * @namespace SocketHandler
 */
let SocketHandler = function(window, undefined) {

	/*------------------------------------*
	 :: Class Variables
	 *------------------------------------*/

	let socket

	/*------------------------------------*
	 :: Public Methods
	 *------------------------------------*/

	/**
	 * Initializes the module. Must be called
	 * before anything else
	 * @memberOf SocketHandler
	 * @access public
	 */
	function init() {

		socket = io.connect()

		initSocketOns()

	}

	/**
	 * Tells the server to make a temporary
	 * cache for some user data so it can
	 * be recovered on page reload
	 * @memberOf SocketHandler
	 * @access public
	 * @param  {string} uname Temp username (not yet confirmed registered)
	 */
	function cacheTempUser(uname) {

		let voxels = WorldData.getVoxelsArr()
		if (voxels.length)
			socket.emit('cache temp user', uname, voxels)

	}

	/**
	 * Get the list of projects for this
	 * user from the server
	 * @memberOf SocketHandler
	 * @access public
	 * @param  {Function} cb Callback to execute on completion
	 */
	function requestProjects(cb) {
		socket.emit('get projects', cb)
	}

	/**
	 * Save the project with the specified name
	 * @memberOf SocketHandler
	 * @access public
	 * @param  {string}   pjtName Name of the project to save
	 * @param  {Function} cb      Callback to execute on completion
	 */
	function saveProject(pjtName, cb) {
		socket.emit('save project', pjtName, cb)
	}

	/**
	 * Create a new project with the given
	 * name / initial voxels
	 * @memberOf SocketHandler
	 * @access public
	 * @param  {string} pjtName Name of the new project
	 * @param  {Object[]} voxels  Array of voxels to add to the project
	 * @param  {Function} cb      Callback to execute on completion
	 */
	function createProject(pjtName, voxels, cb) {
		socket.emit('create project', pjtName, voxels, cb)
	}

	/**
	 * Send a "block removed" socket emit
	 * with the given grid position
	 * @memberOf SocketHandler
	 * @access public
	 * @param  {VoxelUtils.GridVector3} gPos The grid
	 * position of the voxel to remove
	 * @param  {Function} cb Callback to call with
	 * a boolean indicating success
	 */
	function emitBlockRemoved(gPos, cb) {

		let project = User.getCurrentProject()
		let pjtName = project ? project.name : 'guest'

		socket.emit('block removed', {
			x: gPos.x,
			y: gPos.y,
			z: gPos.z
		}, pjtName, cb)

	}

	/**
	 * Send a "block added" socket emit
	 * with the given grid position and color
	 * @memberOf SocketHandler
	 * @access public
	 * @param  {VoxelUtils.GridVector3} gPos The grid
	 * position of the voxel to add
	 * @param {string} hexString Hex color of the voxel
	 * we are adding
	 * @param  {Function} cb Callback to call with
	 * a boolean indicating success
	 */
	function emitBlockAdded(gPos, hexString, cb) {

		let project = User.getCurrentProject()
		let pjtName = project ? project.name : 'guest'

		socket.emit('block added', {
			color: VoxelUtils.hexStringToDec(hexString),
			position: {
				x: gPos.x,
				y: gPos.y,
				z: gPos.z
			}
		}, pjtName, cb)

	}

	/**
	 * Get the socket object
	 * @return {Object} The socket
	 * @memberOf SocketHandler
	 * @access public
	 */
	function getSocket() {
		return socket
	}

	/*------------------------------------*
	 :: Private Methods
	 *------------------------------------*/

	/**
	 * Initialize socket.on events
	 * @memberOf SocketHandler
	 * @access private
	 */
	function initSocketOns() {

		socket.on('update clients', function(num) {
			GUIControlKit.setConnectedClients(num)
		})

		socket.on('multiple logins', function() {

			alert('You are already logged in!')
			GameScene.removeCanvas()
			GUIControlKit.destroy()

		})

		socket.on('block added', function(block) {

			let pos = block.position

			let gPos = new THREE.Vector3(pos.x, pos.y, pos.z).initGridPos()
			let tColor = new THREE.Color(block.color)

			VoxelActions.createVoxelAtGridPos(gPos, '#' + tColor.getHexString())

			GameScene.render()

		})

		socket.on('block removed', function(pos) {

			let gPos = new THREE.Vector3(pos.x, pos.y, pos.z).initGridPos()

			VoxelActions.deleteVoxelAtGridPos(gPos)

		})

		socket.on('load temp cache', function(voxels) {
			WorldData.loadIntoScene(voxels)
			GameScene.render()
			$('#save-as-project').css('display', 'block')
			GUIButtons.saveAsProject()
		})

	}

	/*********** expose public methods *************/

	return {
		init: init,
		emitBlockAdded: emitBlockAdded,
		emitBlockRemoved: emitBlockRemoved,
		getSocket: getSocket,
		requestProjects: requestProjects,
		createProject: createProject,
		saveProject: saveProject,
		cacheTempUser: cacheTempUser
	}

}()
