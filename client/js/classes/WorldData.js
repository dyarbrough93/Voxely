'use strict'

/**
 * Manages the world state (location and
 * color of all voxels)
 * @namespace WorldData
 */
let WorldData = function(window, undefined) {

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
	 :: Class Variables
	 *------------------------------------*/

	let worldData

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

		worldData = {}

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

		let gPos
		let wPos
		let currVox

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

				VoxelActions.createVoxelAtGridPos(gPos, '#' + tColor.getHexString())

			}

		}

	}

	/**
	 * Add a mesh to the world data
	 * @memberOf WorldData
	 * @access public
	 * @param {VoxelUtils.coordStr} coordStr coordinate string of the voxel
	 * @param {THREE.Mesh} mesh The mesh to add
	 */
	function addMesh(gPos, mesh) {
		let coordStr = VoxelUtils.getCoordStr(gPos)
		worldData[coordStr] = mesh
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
		delete worldData[coordStr]
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
		return worldData[coordStr]
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
		addMesh: addMesh,
		getWorldData: getWorldData,
		removeVoxel: removeVoxel
	}

}()
