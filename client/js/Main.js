'use strict'

/**
 * Initializes all classes and triggers
 * the server data retrieval
 * @namespace Main
 */
var Main = function() {

    $(document).ready(function() {

        // prevent middle click directional scroll
        $('body').mousedown(function(e) {
            if (e.button == 1)
                e.preventDefault()
        })

        // initialize classes
        User.init()
        Mouse.init()
        Keys.init()
        GUIControlKit.init()
        GUIButtons.init()
        Raycast.init()
        GameScene.init()
        WorldData.init()
        MapControls.init()
        SocketHandler.init()

        if (njProject)
            WorldData.loadIntoScene(njProject.voxels)

    })

}()
