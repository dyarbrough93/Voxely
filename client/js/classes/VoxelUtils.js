'use strict'

/**
 * Contains a number of utility functions for working with voxels
 * @namespace VoxelUtils
 */
let VoxelUtils = (function(window, undefined) {

    /**
     * A coordinate string defining the grid position of a voxel.
     * Formatted as "x[-]{0,1}[0-9]+y[-]{0,1}[0-9]+z[-]{0,1}[0-9]+".
     * So "x-12y3z15" (x: -12, y: 3, z: 15) would be a valid example.
     * @memberOf VoxelUtils
     * @typedef {string} coordStr
     */

    /**
     * A THREE.Vector3 that represents a grid coordinate. Can
     * be initialized with "new THREE.Vector3().initGridPos()",
     * or by calling "vec3.worldToGrid()".
     * @memberOf VoxelUtils
     * @typedef {THREE.Vector3} GridVector3
     */

    /**
     * A THREE.Vector3 that represents a world coordinate. Can
     * be initialized with "new THREE.Vector3().initWorldPos()",
     * or by calling "vec3.gridToWorld()".
     * @memberOf VoxelUtils
     * @typedef {THREE.Vector3} WorldVector3
     */

    /*------------------------------------*
     :: Public methods
     *------------------------------------*/

     /**
      * Check if a string is propery formatted as a VoxelUtils.coordStr
      * @memberOf VoxelUtils
      * @access public
      * @return {boolean}
      */
    String.prototype.isCoordStr = function() {
        let formatReg = /x[-]*\d+y[-]*\d+z[-]*\d+/
        return !!formatReg.exec(this)
    }

    /**
     * Get a hash hex string ('#1f3c5d86') from a THREE.Color
     * @memberOf VoxelUtils
     * @access public
     * @return {string} The hash hex string
     */
    THREE.Color.prototype.getHashHexString = function() {
        return '#' + this.getHexString()
    }

    /**
     * Sets a THREE.Vector3's values to the
     * center of the closest world "anchor". I.e. the position
     * that would be used to set the world coordinates of a
     * voxel at that location (multiples of 50 for x and z,
     * (multiples of 50) + 25 for y).
     * @memberOf VoxelUtils
     * @access public
     */
    THREE.Vector3.prototype.snapToGrid = function() {

        this.worldToGrid()
        this.gridToWorld()

    }

    /**
     * Converts a THREE.Vector3's values from world
     * coordinates to grid coordinates.
     * @memberOf VoxelUtils
     * @access public
     */
    THREE.Vector3.prototype.worldToGrid = function() {

        let blockSize = Config.getGrid().blockSize

        this.divideScalar(blockSize)

        this.setComponent(0, Math.round(this.x))
        this.setComponent(1, Math.floor(this.y))
        this.setComponent(2, Math.round(this.z))

        this.isGridPos = true
        this.isWorldPos = false

        return this

    }

    /**
     * Converts a THREE.Vector3's values from grid
     * coordinates to world coordinates.
     * @memberOf VoxelUtils
     */
    THREE.Vector3.prototype.gridToWorld = function() {

        let blockSize = Config.getGrid().blockSize

        this.multiplyScalar(blockSize)
        this.setComponent(1, this.y + 25)

        this.isWorldPos = true
        this.isGridPos = false

        return this

    }

    /**
     * Marks this vector as a grid position (game coordinates).
     * @memberOf VoxelUtils
     * @access public
     * @returns {VoxelUtils.GridVector3} This object
     */
    THREE.Vector3.prototype.initGridPos = function() {
        this.isGridPos = true
        return this
    }

    /**
     * Marks this vector as a world position (scene coordinates).
     * @memberOf VoxelUtils
     * @access public
     * @returns {VoxelUtils.WorldVector3} This object
     */
    THREE.Vector3.prototype.initWorldPos = function() {
        this.isWorldPos = true
        return this
    }

    /**
     * Tuple object.
     * @memberOf VoxelUtils
     * @access public
     * @class Tuple
     * @type {object}
     * @property {number} a First value
     * @property {number} b Second value
     */
    function Tuple(a, b) {
        return {
            a: a,
            b: b,
            /**
             * Checks is this is valid tuple.
             * For validation
             * @instance
             * @memberOf VoxelUtils.Tuple
             * @method isValidTuple
             */
            isValidTuple: function() {
                return typeof this.a === 'number' &&
                    typeof this.b === 'number'
            }
        }
    }

    /**
     * Takes a coordinate string, parses it and returns
     * it as a THREE.Vector3.
     *
     * @memberOf VoxelUtils
     * @access public
     * @param {VoxelUtils.coordStr} coordStr Coordinate string representing
     * a grid position
     * @returns {THREE.Vector3} Parsed position vector
     */
    function coordStrParse(coordStr) {

        let xreg = /x[-]*\d+/,
            yreg = /y[-]*\d+/,
            zreg = /z[-]*\d+/

        let pos = {
            x: parseInt(xreg.exec(coordStr)[0].slice(1)),
            y: parseInt(yreg.exec(coordStr)[0].slice(1)),
            z: parseInt(zreg.exec(coordStr)[0].slice(1))
        }

        return new THREE.Vector3(pos.x, pos.y, pos.z).initGridPos()

    }

    /**
     * Takes a THREE.Vector3 and converts it to a coordinate
     * string.
     *
     * @memberOf VoxelUtils
     * @access public
     * @param {VoxelUtils.GridVector3} gPos Position in grid coordinates
     * @returns {VoxelUtils.coordStr} Grid coordinate string
     */
    function getCoordStr(gPos) {

        return "x" + gPos.x + "y" + gPos.y + "z" + gPos.z
    }

    /**
     * Check if the given position is within
     * the global height limit
     * @memberOf VoxelUtils
     * @access public
     * @param  {VoxelUtils.GridVector3} gPos The position
     * @return {boolean}
     */
    function validHeight(gPos) {

        // too high?
        if (gPos.y >= Config.get().maxVoxelHeight) {

            if (!Keys.shiftDown() && !User.stateIsPick()) {
                alert('Max height reached.')
                return false
            }

        }

        // too low?
        if (gPos.y < 0) return false

        return true

    }

    /**
     * Check if the given position is both
     * within the selection bounds and less
     * than the global height limit
     * @memberOf VoxelUtils
     * @access public
     * @param  {VoxelUtils.GridVector3} gPos The position
     * we are checking
     * @return {boolean}
     */
    function validBlockLocation(gPos) {
        return validHeight(gPos) && withinGridBoundaries(gPos)
    }

    /**
     * Checks if a position is within
     * the boundaries of the grid
     * @memberOf VoxelUtils
     * @access public
     * @param  {VoxelUtils.GridVector3} gPos The grid position
     * @return {boolean}
     */
    function withinGridBoundaries(gPos) {

        let spsg = GUIControlKit.getWorkspaceSize()

        let minxz = -(spsg / 2)
        let maxxz = spsg / 2

        return (gPos.x >= minxz &&
            gPos.z >= minxz &&
            gPos.x <= maxxz &&
            gPos.z <= maxxz)

    }

    /**
     * Initializes a voxel mesh with the specified position
     * @memberOf VoxelUtils.
     * @memberOf VoxelUtils
     * @access public
     * @param {object} args  Voxel parameters
     * @param {GridVector3} args.gPos Grid position
     * @param {number} args.color Hex color
     * @return {THREE.Mesh} The threejs voxel mesh
     */
    function initVoxel(args) {

        let blockSize = Config.getGrid().blockSize

        let wPos = args.gPos.clone()
        wPos.gridToWorld()

        let geom = new THREE.BoxGeometry(blockSize, blockSize, blockSize),
            material = new THREE.MeshLambertMaterial({
                color: args.color
            })

        let mesh = new THREE.Mesh(geom, material)
        mesh.castShadow = true

        mesh.name = 'voxel'
        mesh.position.set(wPos.x, wPos.y, wPos.z)
        mesh.updateMatrix()

        return mesh

    }

    /**
     * Counts the number of root attributes in an
     * object.
     *
     * @memberOf VoxelUtils
     * @access public
     * @param {object} obj The object
     * @returns {number}
     */
    function countObjAttrs(obj) {
        let num = 0
        for (let attr in obj) {
            num++
        }
        return num
    }

    /**
     * Get the grid position from an intersect
     * @memberOf VoxelUtils
     * @access public
     * @param  {THREE.Intersect} intersect The intersect
     * @return {VoxelUtils.GridVector3} Grid position, null on none
     */
    function getGridPositionFromIntersect(intersect) {

        let gPos
        let iobj = intersect.object

        if (iobj.name !== 'plane') {

            if (iobj.name === 'voxel') {

                gPos = iobj.position.clone()
                gPos.initWorldPos()
                gPos.worldToGrid()

            } else {

                gPos = (intersect.point).clone().sub(intersect.face.normal)
                gPos.worldToGrid()

            }

            return gPos

        }

        return null

    }

    /**
     * Convert a hexadecimal string to decimal
     * @memberOf VoxelUtils
     * @access public
     * @param  {string} hexString The hex string
     * @return {number} The decimal value
     */
    function hexStringToDec(hexString) {
        return parseInt(hexString.substring(1), 16)
    }

    /**
     * Convert a hexadecimal string to RGB
     * @memberOf VoxelUtils
     * @access public
     * @param  {string} hexString The hex string
     * @return {Object} RGB object
     */
    function hexStringToRgb(hexString) {

        let hs = hexString.charAt(0) === '#' ? hexString.substring(1) : hexString

        return {
            r: parseInt(hs.substring(0, 2), 16) / 255,
            g: parseInt(hs.substring(2, 4), 16) / 255,
            b: parseInt(hs.substring(4, 6), 16) / 255
        }

    }

    /*------------------------------------*
     :: Private methods
     *------------------------------------*/

    /**
     * Check if the voxel at the given coordinate
     * exists in the voxels parameter
     * @param  {number} x      The x coord to check
     * @param  {number} y      The y boord to check
     * @param  {number} z      The z coord to check
     * @param  {WorldData.userData} voxels The voxels object we are checking
     * @return {boolean}       Whether or not a voxel exists at the given coords
     * @memberOf VoxelUtils
     * @access private
     */
    function checkNeighbor(x, y, z, voxels) {

        if (!voxels[x]) return false
        if (!voxels[x][y]) return false
        if (!voxels[x][y][z]) return false
        return true

    }

    /**
     * Remove all faces from the given geom
     * with a normal vector matching the
     * parameter one
     * @param  {THREE.Geometry} geom The geometry
     * @param  {THREE.Vector3} nVec The normal vector we are
     * matching against
     * @memberOf VoxelUtils
     * @access private
     */
    function removeFaces(geom, nVec) {

        for (let i = 0; i < geom.faces.length; i++) {

            let face = geom.faces[i]

            let n = face.normal
            if (n.x === nVec.x && n.y === nVec.y && n.z === nVec.z)
                delete geom.faces[i]

        }

        geom.faces = geom.faces.filter(function(v) {
            return v
        })
        geom.elementsNeedUpdate = true // update faces

    }

    /*********** expose public methods *************/

    return {
        withinGridBoundaries: withinGridBoundaries,
        validBlockLocation: validBlockLocation,
        coordStrParse: coordStrParse,
        hexStringToRgb: hexStringToRgb,
        getCoordStr: getCoordStr,
        initVoxel: initVoxel,
        countObjAttrs: countObjAttrs,
        Tuple: Tuple,
        buildOutlineGeom: buildOutlineGeom,
        hexStringToDec: hexStringToDec,
        getGridPositionFromIntersect: getGridPositionFromIntersect

    }

})(window)
