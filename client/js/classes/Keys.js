'use strict'

/**
 * Manages and routes keyboard events
 * @namespace Keys
 */
let Keys = function(window, undefined) {

    /*------------------------------------*
     :: Class Variables
     *------------------------------------*/

    let keyStates

    /*------------------------------------*
     :: Public Methods
     *------------------------------------*/

    /**
     * Initializes the module. Must be called
     * before anything else
     * @memberOf Keys
     * @access public
     */
    function init() {

        keyStates = {
            shiftDown: false,
            ctrlDown: false
        }

        $(document).on('modalClosed', addEventListeners)
		$(document).on('modalOpened', removeEventListeners)

    }

    /**
     * Is the shift key currently down?
     * @memberOf Keys
     * @access public
     * @return {boolean}
     */
    function isShiftDown() {
        return keyStates.shiftDown
    }

    /**
     * Is the control key currently down?
     * @memberOf Keys
     * @access public
     * @return {boolean}
     */
    function isCtrlDown() {
        return keyStates.ctrlDown
    }

    /**
     * Set the state of the control key.
     * This is needed in scearios where the
     * key events are not triggered (window
     * out of focus)
     * @memberOf Keys
     * @access public
     * @param {boolean} value Value to set it to
     */
    function setCtrlDown(value) {
        keyStates.ctrlDown = value
    }


    /**
     * Set the state of the shift key.
     * This is needed in scearios where the
     * key events are not triggered (window
     * out of focus)
     * @memberOf Keys
     * @access public
     * @param {boolean} value Value to set it to
     */
    function setShiftDown(value) {
        keyStates.shiftDown = value
    }

    /*------------------------------------*
     :: Private Methods
     *------------------------------------*/

    /**
     * Add keyboard event listeners to the document
     * @memberOf Keys
     * @access private
     */
    function addEventListeners() {

        document.addEventListener('keydown', keyDown)
        document.addEventListener('keyup', keyUp)

    }

    /**
     * Remove keyboard event listeners from the document
     * @memberOf Keys
     * @access private
     */
    function removeEventListeners() {

        document.removeEventListener('keydown', keyDown)
        document.removeEventListener('keyup', keyUp)

    }

    /**
     * Route keydown events
     * @memberOf Keys
     * @access private
     * @param  {Event} e
     */
    function keyDown(e) {

        switch (e.keyCode) {

            case 27:
                escDown()
                break

            case 16:
                shiftDown()
                break

            case 17:
                ctrlDown()
                break

        }

    }

    /**
     * Route keyup events
     * @memberOf Keys
     * @access private
     * @param  {Event} e
     */
    function keyUp(e) {

        switch (e.keyCode) {

            case 16:
                shiftUp()
                break

            case 17:
                ctrlUp()
                break

        }

    }

    /**
     * Handle an escape down event
     * @memberOf Keys
     * @access private
     */
    function escDown() {

        if (!User.stateIsDefault()) {
            if (User.stateIsPick())
                GUIControlKit.togglePickColor()
            User.setDefaultState()
        }

    }

    /**
     * Handle a shift down event
     * @memberOf Keys
     * @access private
     */
    function shiftDown() {
        keyStates.shiftDown = true
        Mouse.forceTriggerMouseMove()
    }

    /**
     * Handle a control down event
     * @memberOf Keys
     * @access private
     */
    function ctrlDown() {
        keyStates.ctrlDown = true
    }

    /**
     * Handle a control up event
     * @memberOf Keys
     * @access private
     */
    function ctrlUp() {
        keyStates.ctrlDown = false
    }

    /**
     * Handle a shift up event
     * @memberOf Keys
     * @access private
     */
    function shiftUp() {
        keyStates.shiftDown = false
        Mouse.forceTriggerMouseMove()
    }

    /*********** expose public methods *************/

    return {
        init: init,
        isShiftDown: isShiftDown,
        isCtrlDown: isCtrlDown,
        setCtrlDown: setCtrlDown,
        setShiftDown: setShiftDown
    }

}()
