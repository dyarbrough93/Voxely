'use strict'

/**
 * Manages the game's bootstrap GUI buttons
 * @namespace GUIButtons
 */
let GUIButtons = (function(window, undefined) {

    /*------------------------------------*
	 :: Class Variables
	 *------------------------------------*/

	// export
	let exported
	let matFilename

	let fromBlankProj
	let animSpeed

	/*------------------------------------*
	 :: Public Methods
	 *------------------------------------*/

	/**
	 * Initializes the module. Must be called
	 * before anything else
	 * @memberOf GUIButtons
	 * @access public
	 */
	function init() {

		$(".btn").mouseup(function() {
			$(this).blur()
		})

		matFilename = 'voxelMats'
		fromBlankProj = false
		animSpeed = 185

		initModals()
		initProjectModals()
		initDownloadButtons()

	}

    /**
     * Save current work as a new project
     * @memberOf GUIButtons
	 * @access public
     */
	function saveAsProject() {
		fromBlankProj = true
		User.setProjectNeedsSave(false)
		if (User.getUName() === 'Guest') {

			$('#login-info').css('display', 'block')
			showLogin()

			if (!formOnCreate) {
				formOnCreate = true
				animateForm(0)
			}
		} else {
			$('#new-project-modal').modal()
		}
	}

	/*------------------------------------*
 	 :: Private Methods
 	 *------------------------------------*/

    /**
     * Get the OBJ + MTL files for this project
     * @memberOf GUIButtons
	 * @access private
     */
	function exportVoxels() {

		let exporter = new THREE.OBJExporter()
		exported = exporter.parse(GameScene.getScene(), matFilename)

	}

    /**
     * Show the login modal
     * @memberOf GUIButtons
	 * @access private
     * @param  {Number} animSpeed Speed to animate at
     */
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

    /**
     * Hide the login modal
     * @memberOf GUIButtons
	 * @access private
     * @param  {Number} animSpeed Speed to animate at
     */
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

    /**
     * Initialize some standard modal behavior
     * @memberOf GUIButtons
	 * @access private
     */
	function initModals() {

		$(document).trigger('modalClosed')

		// triggered
		$('.modal').on('hidden.bs.modal', function() {
			$(document).trigger('modalClosed')
		})

		$('.modal').on('shown.bs.modal', function() {
			$(document).trigger('modalOpened')
		})

		initLoginModal()

	}

    /**
     * Initilize the login modal
     * @memberOf GUIButtons
	 * @access private
     */
	function initLoginModal() {

		// open login modal
		$('#button-login').click(function() {
			showLogin(animSpeed)
			if (formOnCreate) {
				animateForm(0)
				formOnCreate = false
			}
		})

		// logout
		$('#button-logout').click(function() {

			let url = window.location.protocol + '//' + window.location.host
			window.location = url + '/signout'

		})

		// hide modal on click background
		$('#modal-background').click(function() {
			hideLogin(animSpeed)
		})

	}

    /**
     * Initialize the download buttons
     * @memberOf GUIButtons
	 * @access private
     */
	function initDownloadButtons() {

		// download obj
		$('#download-obj').click(function() {

			exportVoxels()

			let objBlob = new Blob([exported.obj], {
				type: 'text/plain'
			})

			saveAs(objBlob, 'voxels.obj')

		})

		// download mtl
		$('#download-mtl').click(function() {

			exportVoxels()

			let mtlBlob = new Blob([exported.mtl], {
				type: 'text/plain'
			})

			saveAs(mtlBlob, matFilename + '.mtl')

		})

		// download JSON
		$('#download-json').click(function() {

			let jsonBlob = new Blob([JSON.stringify(GameScene.getScene())], {
				type: 'text/json'
			})

			saveAs(jsonBlob, 'voxels.json')

		})

	}

    /**
     * Initialize the new project / show projects modals
     * @memberOf GUIButtons
	 * @access private
     */
	function initProjectModals() {

		// open new project modal
		$('.new-project').click(function() {
			$('#new-project-modal').modal()
		})

		$('#save-curr-project').click(function() {
			SocketHandler.saveProject(User.getCurrentProject().name, function(err) {
				if (err) {
					alert('Error: Project was not saved.')
					console.log(err)
				} else {
					alert('Project saved!')
					$('#save-curr-project').css('display', 'none')
					User.setProjectNeedsSave(false)
				}
			})
		})

		// prompt user to name / save project
		$('#save-as-project').click(function() {

			saveAsProject()

		})

		// attempt to create a new project
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
					let url = window.location.protocol + '//' + window.location.host
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
					} else {
						console.log('Created project ' + pjtName)
						window.location = url + '/user/' + uname + '/' + pjtName
					}

				})
			} else {
				console.log('Guests should be able to create new projects..??')
			}
		})

		// load all user projects in project
		// modal and open it
		$('#user-projects').click(function() {
			SocketHandler.requestProjects(function(projects) {

				let modalBody = $('#projects-modal .modal-body')
				$(modalBody).children().remove()

				let len = projects.length
				let i = 0
				projects.forEach(function(project) {

					let h5 = $('<h5>').html(project.name)
					let open = $('<a>', {
						href: '/user/' + User.getUName() + '/' + project.name
					}).html('Open')
					let del = $('<a>', {
						href: '/user/' + User.getUName() + '/delete/' + project.name,
						class: 'delete-proj'
					}).html('Delete')
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

                // confirm proj delete
        		$('.delete-proj').click(function(e) {
        			if (!confirm('Are you sure you wan\'t to delete this project?')) {
                        e.preventDefault()
                    }
        		})
			})
		})
	}

	return {
		init: init,
		saveAsProject: saveAsProject
	}

})(window)
