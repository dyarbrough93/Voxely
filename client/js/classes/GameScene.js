'use strict'

/**
 * Manages the game scene (camera, scene, lights, etc)
 * and related game assets
 * @namespace GameScene
 */
let GameScene = function(window, undefined) {

    if (!Detector.webgl) Detector.addGetWebGLMessage()

    /*------------------------------------*
     :: Class Variables
     *------------------------------------*/

    // basic scene els
    let scene
    let camera
    let renderer
    let noaarenderer
    let aarenderer // with antialiasing

    // the game scene div
    let container

    // lights
    let trackingDirLight
    let globalDirLight
    let ambientLight

    // planes
    let voxelPlane
    let voxGeom
    let mapControlsPlane
    let rspColors

    let nullMat

    // grid
    let gridGeom
    let gridOutlineGeom
    let gridConfig
    let gridLines
    let outlineLines

    // meshes
    let ghostMesh
    let deleteMesh

    /*------------------------------------*
     :: Public methods
     *------------------------------------*/

    /**
     * Initializes the game scene. Must be
     * called before anything else.
     * @memberOf GameScene
     * @access public
     */
    function init() {

        scene = new THREE.Scene()
        container = document.getElementById('container')

        gridConfig = Config.getGrid()

        ;
        (function _initCamera() {

            let config = {
                fov: 45,
                near: 100,
                far: 300000,
                distMult: 0.125
            }

            let aspect = window.innerWidth / window.innerHeight

            camera = new THREE.PerspectiveCamera(config.fov, aspect, config.near, config.far)
            camera.position.set(10000 * config.distMult, 15000 * config.distMult, 10000 * config.distMult)
            camera.lookAt(new THREE.Vector3()) // look at 0, 0, 0

        })()

        ;
        (function _initRenderer() {

            function setSharedConfig(r) {

                r.setClearColor('#ffffff')
                r.sortObjects = false
                r.setSize(window.innerWidth, window.innerHeight)
                r.setClearColor(0, 0)

            }

            aarenderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: true
            })

            noaarenderer = new THREE.WebGLRenderer({
                antialias: false,
                alpha: true
            })

            setSharedConfig(aarenderer)
            setSharedConfig(noaarenderer)

            if (Config.getGeneral().aaOnByDefault) renderer = aarenderer
            else renderer = noaarenderer

            container.appendChild(renderer.domElement)

        })()

        ;
        (function _initLights() {

            ambientLight = new THREE.AmbientLight(0xffffff, 0.45)
            scene.add(ambientLight)

            let pos = gridConfig.sqPerSideOfGrid / 2 * 50

            globalDirLight = new THREE.DirectionalLight(0xffffff, 0.6)
            globalDirLight.position.set(pos, pos / 2, 0)
            globalDirLight.target.position.set(0,0,0)
            scene.add(globalDirLight)

			trackingDirLight = new THREE.DirectionalLight(0xffffff, 0.4)
            scene.add(trackingDirLight.target)
			scene.add(trackingDirLight)

        })()

        ;
        (function _initPlanes() {

            let gridSize = gridConfig.size
            let blockSize = gridConfig.blockSize

            nullMat = new THREE.MeshBasicMaterial({
                visible: false
            })

            // this is the plane the voxels are actually placed on.
            initVoxelPlane(gridConfig.size)

            // the floor grid lines
            initFloorGrid(gridConfig.sqPerSideOfGrid)

            // This is the plane that MapControls uses to
            // pan and rotate
            ;
            (function _initControlsPlane() {

                let ctrlGeom = new THREE.PlaneGeometry(gridSize * 40, gridSize * 40)
                ctrlGeom.rotateX(-Math.PI / 2)

                mapControlsPlane = new THREE.Mesh(ctrlGeom, nullMat)

                mapControlsPlane.name = 'plane'

                scene.add(mapControlsPlane)

            })()

        })()

        ;
        (function _initHoverVoxels() {

            // voxel shown when hovering grid
            (function _initGhostVoxel() {

                let blockSize = Config.getGrid().blockSize

                let ghostGeo = new THREE.CubeGeometry(blockSize, blockSize, blockSize)

                let ghostMaterial = new THREE.MeshBasicMaterial({
                    color: GUIControlKit.getBlockColor(),
                    transparent: true,
                    opacity: 0.5,
                    visible: false
                })

                ghostMesh = new THREE.Mesh(ghostGeo, ghostMaterial)
                scene.add(ghostMesh)

            })()

            ;
            // cube rendered over voxel when hovered and shift is held
            (function _initDeleteVoxel() {

                let size = gridConfig.blockSize + (gridConfig.blockSize * 0.02)

                let redXTexture = new THREE.ImageUtils.loadTexture('/img/redx.png')

                let deleteGeo = new THREE.CubeGeometry(size, size, size)
                let deleteMat = new THREE.MeshPhongMaterial({
                    map: redXTexture,
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.4,
                    visible: false
                })

                deleteMesh = new THREE.Mesh(deleteGeo, deleteMat)

                scene.add(deleteMesh)

            })()


        })()

        window.addEventListener('resize', onWindowResize)

    }

    /**
     * Renders the scene
     * @memberOf GameScene
     * @access public
     */
    function render() {

        renderer.render(scene, camera)

    }

    /**
     * Setup the voxel plane with the given size
     * @memberOf GameScene
     * @access public
     * @param  {Number} size Size of the plane
     */
    function initVoxelPlane(size) {

        let stdSideLen = size * 2 + gridConfig.blockSize

        Raycast.remove(voxelPlane)

        voxGeom = new THREE.PlaneGeometry(stdSideLen, stdSideLen)
        voxGeom.rotateX(-Math.PI / 2)

        nullMat = new THREE.MeshBasicMaterial({
            visible: false
        })

        voxelPlane = new THREE.Mesh(voxGeom, nullMat)
        voxelPlane.name = 'plane'

        Raycast.add(voxelPlane)

        //let axisHelper = new THREE.AxisHelper(150)
        //scene.add(axisHelper)

    }

    /**
     * Setup the floor grid
     * @memberOf GameScene
     * @access public
     * @param  {Number} gridSize Grid size
     */
    function initFloorGrid(gridSize) {

        scene.remove(gridLines)
        scene.remove(outlineLines)

        gridGeom = new THREE.Geometry()
        gridOutlineGeom = new THREE.Geometry()

        function drawLine(geom, i) {

            geom.vertices.push(new THREE.Vector3(-size - 25, 0, i))
            geom.vertices.push(new THREE.Vector3( size + 25, 0, i))

            geom.vertices.push(new THREE.Vector3(i, 0, -size - 25))
            geom.vertices.push(new THREE.Vector3(i, 0,  size + 25))

        }

        let step = gridConfig.blockSize
        let size = (gridSize / 2) * gridConfig.blockSize

        // grid outline
        drawLine(gridOutlineGeom, -size - 25)
        drawLine(gridOutlineGeom,  size + 25)

        // grid
        for (let i = -size + 25; i <= size - 25; i += step) {
            drawLine(gridGeom, i)
        }

        let material = new THREE.LineBasicMaterial({ color: 0x000000, opacity: 0.15, transparent: true })

        gridLines = new THREE.LineSegments(gridGeom, material)
        outlineLines = new THREE.LineSegments(gridOutlineGeom, material)

        scene.add(gridLines)
        scene.add(outlineLines)

    }

    /**
     * Turn the delete mesh visibility on or off
     * @memberOf GameScene
     * @access public
     * @param {boolean} visible set visiblity
     */
    function setDeleteMeshVis(visible) {
        deleteMesh.material.visible = visible
    }

    /**
     * Turn the ghost mesh visibility on or off
     * @memberOf GameScene
     * @access public
     * @param {boolean} visible set visibility
     */
    function setGhostMeshVis(visible) {
        ghostMesh.material.visible = visible
    }

    /**
     * Set the color of the ghost mesh
     * @memberOf GameScene
     * @access public
     * @param {number} hColor Hex color to set
     */
    function setGhostMeshColor(hColor) {
        ghostMesh.material.color.setHex(hColor)
        render()
    }

    /**
     * Update the position / visibility of the ghost mesh
     * based on the given intersect
     * @memberOf GameScene
     * @access public
     * @param  {THREE.Intersect} intersect The intersect used to
     * set the position
     */
    function updateGhostMesh(intersect) {

        let gPos = intersect.point.clone().initWorldPos()
        gPos.add(intersect.face.normal).worldToGrid()

        if (!VoxelUtils.validBlockLocation(gPos) ||
            Keys.isShiftDown() || !User.stateIsDefault()) {
            setGhostMeshVis(false)
            return
        }

        setGhostMeshVis(true)

        let gmp = ghostMesh.position

        gmp.copy(intersect.point)
        gmp.add(intersect.face.normal)
        gmp.initWorldPos()
        gmp.snapToGrid()

    }

    /**
     * Update the position and visibility of the
     * delete mesh based on the given intersect
     * @memberOf GameScene
     * @access public
     * @param  {THREE.Intersect} intersect The intersect
     * used to set the position
     */
    function updateDeleteMesh(intersect) {

        if (intersect.object.name === 'plane' ||
            !Keys.isShiftDown()) {
            setDeleteMeshVis(false)
            return
        }

        setDeleteMeshVis(true)

        let dmp = deleteMesh.position

        dmp.copy(intersect.point)
        dmp.sub(intersect.face.normal)
        dmp.initWorldPos()
        dmp.snapToGrid()

    }

    /**
     * Switch between the antialiasing
     * renderer and the non-antialiasing renderer
     * @access public
     * @memberOf GameScene
     */
    function switchRenderer() {

        removeCanvas()

        if (renderer === aarenderer)
            renderer = noaarenderer
        else renderer = aarenderer

        container.appendChild(renderer.domElement)

        onWindowResize()

    }

    /**
     * Adds an object to the scene
     * @memberOf GameScene
     * @access public
     * @param {THREE.Object} obj The object to add
     */
    function addToScene(obj) {
        scene.add(obj)
    }

    /**
     * Remove an object from the scene
     * @memberOf GameScene
     * @access public
     * @param  {THREE.Object} obj The object to remove
     */
    function removeFromScene(obj) {
        scene.remove(obj)
    }

    /**
     * Remove the canvas from the game container
     * @memberOf GameScene
     * @access public
     */
    function removeCanvas() {
        container.removeChild(container.getElementsByTagName('canvas')[0])
    }

    /**
     * Set the position and target of the direcitonal light
     * @memberOf GameScene
     * @access public
     * @param {VoxelUtils.WorldVector3} position World position to set
     * @param {VoxelUtils.WorldVector3} target   What the light should look at (optional)
     */
    function setDirLightPos(position, target) {
        trackingDirLight.position.set(position.x, position.y, position.z)
        if (target) trackingDirLight.target.position.set(target.x, 500, target.z)
    }

    /******************Getters *************/

    function getMapControlsPlane() {
        return mapControlsPlane
    }

    function getCamera() {
        return camera
    }

    function getScene() {
        return scene
    }

    /*------------------------------------*
     :: Private methods
     *------------------------------------*/

    /**
     * Resizes on the scene when the window
     * is resized
     * @memberOf GameScene
     * @access private
     */
    function onWindowResize() {

        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()

        renderer.setSize(window.innerWidth, window.innerHeight)
        render()

    }

    /*********** expose public methods *************/

    return {

        init: init,
        removeCanvas: removeCanvas,
        switchRenderer: switchRenderer,
        addToScene: addToScene,
        removeFromScene: removeFromScene,
        setDeleteMeshVis: setDeleteMeshVis,
        setGhostMeshVis: setGhostMeshVis,
        setGhostMeshColor: setGhostMeshColor,
        updateGhostMesh: updateGhostMesh,
        updateDeleteMesh: updateDeleteMesh,
        getMapControlsPlane: getMapControlsPlane,
        getScene: getScene,
        getCamera: getCamera,
        setDirLightPos: setDirLightPos,
        render: render,
        initFloorGrid: initFloorGrid,
        initVoxelPlane: initVoxelPlane

    }

}(window)
