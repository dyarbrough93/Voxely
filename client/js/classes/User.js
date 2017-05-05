'use strict'

/**
 * Manages and stores the user's current state
 * @namespace UserState
 */
let User = function(window, undefined) {

    /*------------------------------------*
     :: Class Variables
     *------------------------------------*/

    let states
    let state
    let actionTimer
    let currentHoveredUser
    let actionDelay

    /*------------------------------------*
     :: Public Methods
     *------------------------------------*/

    /**
     * Initializes the module. Must be called
     * before anything else
     * @memberOf UserState
     * @access public
     */
    function init() {

        states = {
            DEFAULT: 0,
            PICKCOLOR: 1
        }

        setDefaultState()

        actionDelay = Config.getGeneral().actionDelay

        let now = Date.now()
        actionTimer = new Date(now - actionDelay)

    }

    /**
     * Reset the action timer to delay
     * actions again
     * @memberOf UserState
     * @access public
     */
    function resetActionTimer() {
        actionTimer = new Date()
    }

    /**
     * Checks if the user can act
     * based on the actionDelay config
     * setting and the last time acted
     * @memberOf UserState
     * @access public
     * @return {boolean}
     */
    function canAct() {
        let msSinceAct = new Date(new Date() - actionTimer).getTime()
        return msSinceAct > actionDelay
    }

    /*********** setters *************/

    /**
     * Set the user state to default
     * @memberOf UserState
     * @access public
     */
    function setDefaultState() {
        state = states.DEFAULT
        $('body').css('cursor', 'url(/img/default.cur), auto')
    }

    /**
     * Set the user state to PICKCOLOR
     * @memberOf UserState
     * @access public
     */
    function setPickState() {
        state = states.PICKCOLOR
        $('body').css('cursor', 'url(/img/picker.cur), auto')
    }

    function setCurrentHoveredUser(user) {
        currentHoveredUser = user
    }

    /*********** getters *************/

    /**
     * Is the user state pick?
     * @memberOf UserState
     * @access public
     * @return {boolean}
     */
    function stateIsPick() {
        return state === states.PICKCOLOR
    }

    function stateIsDefault() {
        return state === states.DEFAULT
    }

    function getUName() {
        let username = $('#user #username').html()
        if (!username) username = 'Guest'
        let res = /[a-zA-Z0-9_]+/.exec(username)
        if (res) username = res[0]
        return username
    }

    function getCurrentHoveredUser() {
        return currentHoveredUser
    }

    function getActionDelay() {
        return actionDelay
    }

    /*********** expose public methods *************/

    return {
        init: init,
        canAct: canAct,
        getUName: getUName,
        resetActionTimer: resetActionTimer,
        stateIsPick: stateIsPick,
        stateIsDefault: stateIsDefault,
        setDefaultState: setDefaultState,
        setPickState: setPickState,
        getCurrentHoveredUser: getCurrentHoveredUser,
        setCurrentHoveredUser: setCurrentHoveredUser,
        getActionDelay: getActionDelay
    }

}(window)
