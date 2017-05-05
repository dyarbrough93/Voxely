'use strict'

/**
 * Manages the world state (location and
 * color of all voxels)
 * @namespace WorldData
 */
let WorldData = function(window, undefined) {

	/**
	 * An object containing information on voxel
	 * ownership, with keys being usernames and values
	 * being Objects containing the owned voxels in a
	 * coordinate tree (for fast indexing), with the following format:
	 *<pre><code>
	 * {
	 *     'username': {
	 *         1 : {
	 *             5 : {
	 *                 3 {}
	 *             },
	 *             4 : {
	 *                 2 : {}
	 *             }
	 *         },
	 *         6 : {
	 *             2 : {
	 *                 1 : {}
	 *             }
	 *         }
	 *     }
	 * }
	 *</code></pre>
	 * with the first level as the x coordinate, the second level as
	 * the y coordinate, and the third level as the z coordinate. So,
	 * in the above example, "username" owns voxels {1, 5, 3}, {1, 4, 2}, and {6, 2, 1}
	 * @memberOf WorldData
	 * @typedef {Object} userData
	 */

	/**
	 * An object containing information on all of the
	 * voxels currently in the world, where keys are
	 * {@link VoxelUtils.coordStr} and values can be either
	 * a THREE.Mesh (a newly placed voxel) or a {@link WorldData.VoxelInfo}
	 * The structure looks like this:
	 *<pre><code>
	 * {
	 *     'x12y10z-5': {@link WorldData.VoxelInfo}
	 *     'x-5y4z3': {@link WorldData.VoxelInfo}
	 *     'x7y1z8': {THREE.Mesh}
	 * }
	 *</code></pre>
	 * @memberOf WorldData
	 * @typedef {Object} worldData
	 */

	/*------------------------------------*
	 :: Classes
	 *------------------------------------*/

	/**
	 * @class VoxelInfo
	 * @param {number} hColor Hex color
	 * @param {number} bIdx Buffer index. used with BufMeshMgr
	 * @memberOf WorldData
	 */
	function VoxelInfo(hColor, bIdx) {

		this.hColor = hColor
		this.bIdx = bIdx

	}

	/*------------------------------------*
	 :: Class Variables
	 *------------------------------------*/

	let worldData
	let userData

	/*------------------------------------*
	 :: Public Methods
	 *------------------------------------*/

	/**
	 * Initializes the module. Must be called
	 * before anything else
	 * @memberOf WorldData
	 * @access public
	 */
	function init() {

		let secPerSide = Config.getGrid().sectionsPerSide

		worldData = []
		userData = {}
		for (let i = 0, len1 = secPerSide; i < len1; i++) {
			worldData[i] = []
			for (let j = 0, len2 = secPerSide; j < len2; j++) {
				worldData[i][j] = {}
			}
		}

	}

	/**
	 * Load all of the world data into the scene
	 * @memberOf WorldData
	 * @access public
	 * @param {object} data Contains all of the data
	 * to load in, retrieved viq the SocketHandler
	 */
	function loadIntoScene(data) {

		console.log('loading pixels into scene ...')

		let numCubes = countVoxels(data)
		initVoxels(numCubes, data)

		console.log('done loading voxels')

		GameScene.render()

	}

	function countVoxels(data) {

		let numCubes = 0

		for (let coordStr in data) {
			if (data.hasOwnProperty(coordStr)) {
				numCubes++
			}
		}

		return numCubes

	}

	function initVoxels(numCubes, data) {

		BufMeshMgr.createBufMesh(numCubes, GameScene.getScene())

		let gPos
		let wPos
		let currVox

		let i = 0
		let bufVertsLen = BufMeshMgr.getBufVertsLen()

		for (let voxPos in data) {

			gPos = VoxelUtils.coordStrParse(voxPos).initGridPos()
			wPos = gPos.clone().gridToWorld()
			currVox = data[voxPos]

			if (VoxelUtils.validBlockLocation(gPos)) {

				let hColor = currVox.c
				let tColor = new THREE.Color(hColor)

				/*// vvv black magic, don't touch
				if (i === 0) console.log(wPos)
				// ^^^ somehow fixes raycast lag*/

				BufMeshMgr.addVoxel(i, wPos, tColor)
				currVox.bIdx = i

				let voxInfo = new VoxelInfo(hColor, i)
				addVoxel(gPos, voxInfo)

			}

			i += bufVertsLen

		}

		let bufMesh = BufMeshMgr.getBufMesh()

		Raycast.add(bufMesh)
		GameScene.addToScene(bufMesh)

	}

	/**
	 * Creates a VoxelInfo entry in the worldData object with the specified
	 * parameters.
	 * @memberOf WorldData
	 * @access public
	 * @param {WorldData.VoxelInfo} voxInfo Object containing the voxel information
	 */
	function addVoxel(gPos, voxInfo) {
		let coordStr = VoxelUtils.getCoordStr(gPos)
		let sid = VoxelUtils.getSectionIndices(gPos)
        worldData[sid.a][sid.b][coordStr] = voxInfo
	}

	/**
	 * Add a mesh to the world data
	 * @memberOf WorldData
	 * @access public
	 * @param {VoxelUtils.Tuple} sid Section indices of the voxel we are adding
	 * @param {VoxelUtils.coordStr} coordStr coordinate string of the voxel
	 * @param {THREE.Mesh} mesh The mesh to add
	 */
	function addMesh(gPos, mesh) {
		let coordStr = VoxelUtils.getCoordStr(gPos)
		let sid = VoxelUtils.getSectionIndices(gPos)
		worldData[sid.a][sid.b][coordStr] = mesh
	}

	/**
	 * Remove a voxel from worldData
	 * @memberOf WorldData
	 * @access public
	 * @param  {VoxelUtils.GridVector3} gPos Grid position of
	 * the voxel to remove
	 */
	function removeVoxel(gPos) {
		let coordStr = VoxelUtils.getCoordStr(gPos)
		let sid = VoxelUtils.getSectionIndices(gPos)
		delete worldData[sid.a][sid.b][coordStr]
	}

	/**
	 * Retrieve a voxel with the specified
	 * section indices and coordStr
	 * @param  {VoxelUtils.GridVector3} gPos Grid position of
	 * the voxel to get
	 * @return {object} The mesh or object
	 * @access public
	 * @memberOf WorldData
	 */
	function getVoxel(gPos) {
		let coordStr = VoxelUtils.getCoordStr(gPos)
		let sid = VoxelUtils.getSectionIndices(gPos)
		return worldData[sid.a][sid.b][coordStr]
	}

	/**
	 * Add a coordinate to the attribute of the userData
	 * object with the given username
	 * @param {string} username The username index
	 * @param {VoxelUtils.GridVector3} gPos Grid coordinate to add
	 * @access public
	 * @memberOf WorldData
	 */
	function addToUserData(username, gPos) {

		if (!userData.hasOwnProperty(username)) userData[username] = {}

		if (!userData[username][gPos.x]) userData[username][gPos.x] = {}
		if (!userData[username][gPos.x][gPos.y]) userData[username][gPos.x][gPos.y] = {}
		if (!userData[username][gPos.x][gPos.y][gPos.z]) userData[username][gPos.x][gPos.y][gPos.z] = {}

	}

	/**
	 * Remove a coordinate from the attribute of
	 * userData that matches the given
	 * @param  {string} username The username index
	 * @param  {VoxelUtils.GridVector3} gPos Grid coordinate to remove
	 * @access public
	 * @memberOf WorldData
	 */
	function removeFromUserData(username, gPos) {

		if (userData.hasOwnProperty(username)) {

			if (!userData[username][gPos.x]) return
			if (!userData[username][gPos.x][gPos.y]) return
			delete userData[username][gPos.x][gPos.y][gPos.z]

		}

	}

	function getUsernameAtIntersect(intersect) {

		let gPos = VoxelUtils.getGridPositionFromIntersect(intersect)
		if (!gPos) return
		let voxel = WorldData.getVoxel(gPos)

		let username
		if (voxel.isMesh) username = voxel.userData.username
		username = voxel.username

		if (!username) return 'Guest'
		return username

	}

	/**
	 * Return the voxels for the give username
	 * @param  {string} username The username index
	 * @return {Object} Voxels owned by that user
	 */
	function getUserVoxels(username) {
		return userData[username]
	}

	/**
	 * Return the worldData object
	 * @return {Ojbect} The world data
	 */
	function getWorldData() {
		return worldData
	}

	/*********** expose public methods *************/

	return {
		init: init,
		loadIntoScene: loadIntoScene,
		getVoxel: getVoxel,
		addVoxel: addVoxel,
		addMesh: addMesh,
		getUserVoxels: getUserVoxels,
		getWorldData: getWorldData,
		removeVoxel: removeVoxel,
		addToUserData: addToUserData,
		removeFromUserData: removeFromUserData,
		VoxelInfo: VoxelInfo,
		getUsernameAtIntersect: getUsernameAtIntersect
	}

}()
