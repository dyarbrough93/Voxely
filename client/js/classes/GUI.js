'use strict'

/**
 * Manages the game's dat.GUI
 * @namespace GUI
 */
let GUI = function(window, undefined) {

	/*------------------------------------*
	 :: Class Variables
	 *------------------------------------*/

	let settings
	let controlKit
	let guiClicked

	// export
	let exported
	let matFilename

	/*------------------------------------*
	 :: Public Methods
	 *------------------------------------*/

	/**
	 * Initializes the module. Must be called
	 * before anything else
	 * @memberOf GUI
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
			sliderRange: [5, 101],
			connectedClients: 0
		}

		controlKit = new ControlKit()
		guiClicked = false

		initControlKit()
		initModals()

		$(".btn").mouseup(function() {
			$(this).blur()
		})

		initButtons()

	}

	/**
	 * Given an intersect, extract the color of the intersected
	 * block (if it was a block that was intersected) and assign it
	 * to the blockColor + update the Game scenes ghost mesh
	 * @memberOf GUI
	 * @access public
	 * @param {THREE.Intersect} intersect The intersect
	 */
	function setPickColor(intersect) {

		let iObj = intersect.object
		let objName = iObj.name

		let pickColor

		if (objName !== 'plane') {

			if (objName === 'BufferMesh') {

				let bufColArr = iObj.geometry.attributes.color.array
				let idx = intersect.index * 3

				pickColor = new THREE.Color(bufColArr[idx], bufColArr[idx + 1], bufColArr[idx + 2])

			} else { // voxel

				pickColor = intersect.face.color

			}

			let hColor = pickColor.getHex()
			let hexString = '#' + pickColor.getHexString()

			GameScene.setGhostMeshColor(hColor ^ 0x4C000000)

			settings.colors.blockColor = hexString
			pushToSavedColors()

			controlKit.update()

		}

		togglePickColor()

	}

	/**
	 * Get the current block color
	 * @memberOf GUI
	 * @access public
	 * @return {number} The block color
	 */
	function getBlockColor() {
		return settings.colors.blockColor
	}

	/**
	 * Return whether or not the GUI was click
	 * before the mouse click event was received
	 * @memberOf GUI
	 * @access public
	 * @return {number} The block color
	 */
	function wasClicked() {
		return guiClicked
	}

	/**
	 * Set clicked to true or false
	 * @memberOf GUI
	 * @access public
	 * @param clicked What to set it to
	 */
	function setClicked(clicked) {
		guiClicked = clicked
	}

	function destroy() {
		gui.destroy()
	}

	function displayString(string) {
		settings.debug.hoveredUser = string
		controlKit.update()
	}

	function setCoords(planeIntx) {

		if (planeIntx) {
			let gPos = (planeIntx.point).clone().add(planeIntx.face.normal).worldToGrid()
			settings.coords = '(' + gPos.x + ', ' + gPos.z + ')'
			controlKit.update()
		}
	}

	function showModal() {
		$('#welcome-modal').modal()
	}

	/*------------------------------------*
	 :: Private Methods
	 *------------------------------------*/

	function exportVoxels() {

		var exporter = new THREE.OBJExporter()
		exported = exporter.parse(GameScene.getScene(), matFilename)

	}

	/**
	 * Add the necessary elements to the gui
	 * @memberOf GUI
	 * @access private
	 */
	function initControlKit() {

		let mainPanel = controlKit.addPanel({
			label: ' ',
			align: 'right',
			width: 275
		})

		mainPanel.addGroup({
				label: 'Controls'
			})
			.addSubGroup({
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

		mainPanel.addGroup({
				label: 'Info',
				enable: false
			})
			.addStringOutput(settings, 'connectedClients', {
				label: 'Connections'
			})
			.addStringOutput(settings, 'coords', {
				label: 'Coordinates'
			})
			.addStringInput(settings.debug, 'userName', {
				label: 'Username'
			})
			.addButton('Show Controls', function() {
				$(document).trigger('modalOpened')
				showModal()
			})

		mainPanel.addGroup({
				label: 'Settings',
				enable: false
			})
			.addCheckbox(settings.userSettings, 'useAA', {
				label: 'Antialiasing',
				onChange: function() {
					GameScene.switchRenderer()
				}
			})

		mainPanel.addGroup({
				label: 'Debug',
			})
			.addButton('Log Scene', function() {
				console.log(GameScene.getScene())
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

	function showLogin(animSpeed) {

		$(document).trigger('modalOpened')

		$('#login-modal').css('z-index', 3)
		$('#modal-background').css('z-index', 2)

		$('#login-modal').animate({
			opacity: 1
		}, {
			queue: false
		}, animSpeed)

		$('#modal-background').animate({
			opacity: 0.5
		}, {
			queue: false
		}, animSpeed)

	}

	function hideLogin(animSpeed) {

		$('#login-modal').animate({
			opacity: 0
		}, {
			queue: false,
			duration: animSpeed,
			done: function() {
				$('#login-modal').css('z-index', -1)
			}
		})

		$('#modal-background').animate({
			opacity: 0
		}, {
			queue: false,
			duration: animSpeed,
			done: function() {
				$('#modal-background').css('z-index', -1)
				$(document).trigger('modalClosed')
			}
		})

	}

	function initModals() {

		let animSpeed = 185

		$(document).trigger('modalClosed')

		$('.modal').on('hidden.bs.modal', function() {
			$(document).trigger('modalClosed')
		})

		$('.modal').on('shown.bs.modal', function() {
			$(document).trigger('modalOpened')
		})

		$('#button-login').click(function() {
			showLogin(animSpeed)
			if (formOnCreate) {
				animateForm(0)
				formOnCreate = false
			}
		})

		$('#modal-background').click(function() {
			hideLogin(animSpeed)
		})
	}

	function initButtons() {

		matFilename = 'voxelMats'

		$('#download-obj').click(function() {

			exportVoxels()

			let objBlob = new Blob([exported.obj], {
				type: 'text/plain'
			})

			saveAs(objBlob, 'voxels.obj')

		})

		$('#download-mtl').click(function() {

			exportVoxels()

			let mtlBlob = new Blob([exported.mtl], {
				type: 'text/plain'
			})

			saveAs(mtlBlob, matFilename + '.mtl')

		})

		$('#download-json').click(function() {

			let jsonBlob = new Blob([JSON.stringify(GameScene.getScene())], {
				type: 'text/json'
			})

			saveAs(jsonBlob, 'voxels.json')

		})

		$('.new-project').click(function() {

			$('#new-project-modal').modal()

		})

		$('#button-logout').click(function() {

			let url = window.location.protocol + '//' + window.location.host
			window.location = url + '/signout'

		})

		let fromBlankProj = false
		$('#save-project').click(function() {

			fromBlankProj = true
			if (User.getUName() === 'Guest') {

				showLogin()

				if (!formOnCreate) {
					formOnCreate = true
					animateForm(0)
				}
			}
			else {
				$('#new-project-modal').modal()
			}

		})

		$('#new-project-form').submit(function(e) {

			e.preventDefault()
			$('#new-project-modal').modal('hide')

			let pjtName = $('#new-project-modal #new-project-name').val()
			let uname = User.getUName()
			let voxels = []
			if (fromBlankProj) {
				fromBlankProj = false
				voxels = WorldData.getVoxelsArr()
			}

			if (uname && uname !== 'Guest') {

				SocketHandler.createProject(pjtName, voxels, function(err) {
					let url = window.location.protocol +  '//' + window.location.host
					if (err) {

						console.log(err)

						let msg
						let responses = SocketResponses.get()
						if (err === responses.unexpectedErr)
							msg = 'Unexpected error.'
						else if (err === responses.noProjName)
							msg = 'You must specify a project name.'
						else if (err === responses.duplicateProj)
							msg = 'A project with that name already exists.'
						else
							msg = 'Unknown.'

						alert('Error: Project not created. ' + msg)
					}
					else {
						console.log('Created project ' + pjtName)
						window.location = url + '/user/' + uname + '/' + pjtName
					}

				})
			} else {
				console.log('Guests should be able to create new projects..??')
			}
		})

		$('.delete-proj').click(function() {
			confirm('ta')
			console.log('elete')
		})

		$('#user-projects').click(function () {
		    SocketHandler.requestProjects(function(projects) {

	            let modalBody = $('#projects-modal .modal-body')
	            $(modalBody).children().remove()

				let len = projects.length
				let i = 0
	            projects.forEach(function(project) {

	                let h5 = $('<h5>').html(project.name)
					let open = $('<a>', { href: '/user/' + User.getUName() + '/' + project.name }).html('Open')
					let del = $('<a>', { href: '/user/' + User.getUName() + '/delete/' + project.name, class: 'delete-proj' }).html('Delete')
					let hr = $('<hr>')

					modalBody.append(h5)
					modalBody.append(open)
					modalBody.append(' | ')
					modalBody.append(del)
					if (i < len - 1)
						modalBody.append(hr)

					i++

	            })

				$('#projects-modal').modal()

		    })
		})
	}

	/**
	 * If the pick color button is clicked,
	 * set the users state to pickcolor
	 * @memberOf GUI
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

	/**
	 * Set the block color to a random color
	 * @memberOf GUI
	 * @access private
	 */
	function setRandomBlockColor() {
		let randColor = randomHexColor()
		GameScene.setGhostMeshColor(randColor.getHex())
		settings.colors.blockColor = randColor.getHashHexString()
		pushToSavedColors()
		controlKit.update()
	}

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
	 * @memberOf GUI
	 * @access private
	 * @return {number} The random hex color
	 */
	function randomHexColor() {
		return new THREE.Color(0xffffff * Math.random())
	}

	function getControlKit() {
		return controlKit
	}

	function setConnectedClients(num) {
		settings.connectedClients = num
	}

	/*********** expose public methods *************/

	return {
		init: init,
		destroy: destroy,
		displayString: displayString,
		getBlockColor: getBlockColor,
		wasClicked: wasClicked,
		setClicked: setClicked,
		setPickColor: setPickColor,
		setCoords: setCoords,
		togglePickColor: togglePickColor,
		getControlKit: getControlKit,
		setConnectedClients: setConnectedClients
	}

}(window)
