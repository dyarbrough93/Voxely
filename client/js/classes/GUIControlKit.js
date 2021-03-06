'use strict'

/**
 * Manages the game's ControlKit GUI
 * @namespace GUIControlKit
 */
let GUIControlKit = function(window, undefined) {

	/*------------------------------------*
	 :: Class Variables
	 *------------------------------------*/

	let settings
	let controlKit
	let guiClicked

	/*------------------------------------*
	 :: Public Methods
	 *------------------------------------*/

	/**
	 * Initializes the module. Must be called
	 * before anything else
	 * @memberOf GUIControlKit
	 * @access public
	 */
	function init() {

		let startingBlockColor = randomHexColor().getHashHexString()

		settings = {
			colors: {
				blockColor: startingBlockColor,
				prevBlockColor: startingBlockColor,
				saved: [],
				randomColor: setRandomBlockColor
			},
			debug: {
				logWorldData: function() {
					let worldData = WorldData.getWorldData()
					for (let i = 0; i < worldData.length; i++) {
						for (let j = 0; j < worldData[i].length; j++) {
							for (let voxPos in worldData[i][j]) {
								console.log('voxPos: ' + voxPos)
							}
						}
					}
				},
				hoveredUser: '',
				userName: User.getUName()
			},
			userSettings: {
				useAA: Config.getGeneral().aaOnByDefault
			},
			coords: '',
			workSpace: {
				size: Config.getGrid().sqPerSideOfGrid,
				range: [20, 200]
			},
			connectedClients: 0
		}

		controlKit = new ControlKit()
		guiClicked = false

		initControlKit()

		let uname = User.getUName()
		if (!uname || uname === 'Guest')
			showModal()

	}

	/**
	 * Given an intersect, extract the color of the intersected
	 * block (if it was a block that was intersected) and assign it
	 * to the blockColor + update the Game scenes ghost mesh
	 * @memberOf GUIControlKit
	 * @access public
	 * @param {THREE.Intersect} intersect The intersect
	 */
	function setPickColor(intersect) {

		let iObj = intersect.object
		let objName = iObj.name

		let pickColor

		if (objName !== 'plane') {

			if (objName === 'voxel') {

				pickColor = intersect.object.material.color

				let hColor = pickColor.getHex()
				let hexString = '#' + pickColor.getHexString()

				GameScene.setGhostMeshColor(hColor ^ 0x4C000000)

				settings.colors.blockColor = hexString
				pushToSavedColors()

				controlKit.update()

			}

		}

		togglePickColor()

	}

	/**
	 * Get the current block color
	 * @memberOf GUIControlKit
	 * @access public
	 * @return {number} The block color
	 */
	function getBlockColor() {
		return settings.colors.blockColor
	}

	/**
	 * Return whether or not the GUI was click
	 * before the mouse click event was received
	 * @memberOf GUIControlKit
	 * @access public
	 * @return {number} The block color
	 */
	function wasClicked() {
		return guiClicked
	}

	/**
	 * Set clicked to true or false
	 * @memberOf GUIControlKit
	 * @memberOf GUIControlKit
	 * @access public
	 */
	function setClicked(clicked) {
		guiClicked = clicked
	}

	/**
	 * Display the currently hovered coordinates in the GUI
	 * @memberOf GUIControlKit
	 * @access public
	 * @param {THREE.Intersect} planeIntx The plane intersect
	 */
	function setCoords(planeIntx) {

		if (planeIntx) {
			let gPos = (planeIntx.point).clone().add(planeIntx.face.normal).worldToGrid()
			settings.coords = '(' + gPos.x + ', ' + gPos.z + ')'
			controlKit.update()
		}
	}

	/**
	 * If the pick color button is clicked,
	 * set the users state to pickcolor
	 * @memberOf GUIControlKit
	 * @access private
	 */
	function togglePickColor() {
		if (User.stateIsDefault()) {
			$('#controlKit [value="Color Picker"]').val('Click Voxel')
			User.setPickState()
		} else if (User.stateIsPick()) {
			$('#controlKit [value="Click Voxel"]').val('Color Picker')
			User.setDefaultState()
		}
	}

	function getControlKit() {
		return controlKit
	}

	function setConnectedClients(num) {
		settings.connectedClients = num
	}

	function getWorkspaceSize() {
		return settings.workSpace.size
	}

	/*------------------------------------*
	 :: Private Methods
	 *------------------------------------*/

	/**
	 * Add the necessary elements to the gui
	 * @memberOf GUIControlKit
	 * @access private
	 */
	function initControlKit() {

		let mainPanel = controlKit.addPanel({
			label: 'Controls',
			align: 'right',
			width: 325
		})

		mainPanel.addSubGroup({
				label: 'Colors'
			})
			.addColor(settings.colors, 'blockColor', {
				presets: 'saved',
				label: 'Block Color',
				onChange: function(newColor) {
					// get decimal
					let dColor = VoxelUtils.hexStringToDec(newColor)
					GameScene.setGhostMeshColor(dColor)
					pushToSavedColors()
				}
			})
			.addButton('Color Picker', togglePickColor)
			.addButton('Random Color', settings.colors.randomColor)

		mainPanel.addSubGroup({
				label: 'Info'
			})
			.addStringOutput(settings, 'coords', {
				label: 'Coordinates'
			})
			.addButton('Show Controls', function() {
				$(document).trigger('modalOpened')
				showModal()
			})

		mainPanel.addSubGroup({
				label: 'Settings'
			})
			.addCheckbox(settings.userSettings, 'useAA', {
				label: 'Antialiasing',
				onChange: function() {
					GameScene.switchRenderer()
				}
			})
			.addSlider(settings.workSpace, 'size', 'range', {
				label: 'Workspace Size',
				step: 2,
				dp: 0,
				onChange: function() {
					if (settings.workSpace.size % 2 !== 0)
						settings.workSpace.size = settings.workSpace.size - 1
					GameScene.initFloorGrid(settings.workSpace.size)
					GameScene.initVoxelPlane(settings.workSpace.size * (Config.getGrid().blockSize / 2))
				}
			})

		// if it was the gui that was clicked,
		// save this fact so that we can prevent
		// world actions from taking place behind it
		$('#controlKit *, .btn').mousedown(function() {
			guiClicked = true
			// this has to be assigned here because
			// some elements don't exist on page load
			$('#controlKit *').mousedown(function() {
				guiClicked = true
			})

		})

	}

	/**
	 * Show the welcome modal
	 * @memberOf GUIControlKit
	 * @access private
	 */
	function showModal() {
		$('#welcome-modal').modal()
	}

	/**
	 * Set the block color to a random color
	 * @memberOf GUIControlKit
	 * @access private
	 */
	function setRandomBlockColor() {
		let randColor = randomHexColor()
		GameScene.setGhostMeshColor(randColor.getHex())
		settings.colors.blockColor = randColor.getHashHexString()
		pushToSavedColors()
		controlKit.update()
	}

	/**
	 * Push the old block color to our saved colors
	 * @memberOf GUIControlKit
	 * @access private
	 */
	function pushToSavedColors() {
		let maxColors = Config.getGUI().maxSavedColors

		let savedColors = settings.colors.saved
		let prevBlockColor = settings.colors.prevBlockColor

		let idx = savedColors.indexOf(prevBlockColor)
		if (idx !== -1) savedColors.splice(idx, 1)

		savedColors.unshift(prevBlockColor)
		if (savedColors.length > maxColors) savedColors.pop()
		settings.colors.prevBlockColor = settings.colors.blockColor
	}

	/**
	 * Get a random hex color
	 * @memberOf GUIControlKit
	 * @access private
	 * @return {number} The random hex color
	 */
	function randomHexColor() {
		return new THREE.Color(0xffffff * Math.random())
	}

	/*********** expose public methods *************/

	return {
		init: init,
		getBlockColor: getBlockColor,
		wasClicked: wasClicked,
		setClicked: setClicked,
		setPickColor: setPickColor,
		setCoords: setCoords,
		togglePickColor: togglePickColor,
		getControlKit: getControlKit,
		setConnectedClients: setConnectedClients,
		getWorkspaceSize: getWorkspaceSize
	}

}(window)
