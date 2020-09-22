(function () {
    var Marzipano = window.Marzipano;
    var bowser = window.bowser;

    var APP_DATA = {
        "scenes": tails,
        "name": "Project Title",
        "settings": {
            "mouseViewMode": "drag",
            "autorotateEnabled": false,
            "fullscreenButton": false,
            "viewControlButtons": false
        }
    };

    // Grab elements from DOM.
    var panoElement = document.querySelector('#pano');
    var sceneNameElement = document.querySelector('#titleBar .sceneName');
    var mapListElement = document.querySelector('#mapList');
    var sceneElements = document.querySelectorAll('#mapList .scene');
    var mapListToggleElement = document.querySelector('#mapToggle');


    panoElement.addEventListener('mousedown', mousedownFn);

    function mousedownFn() {
        panoElement.addEventListener('mousemove', rotateMapFn);

        function rotateMapFn() {
            var scene = viewer.scene(); // get the current scene
            var view = scene.view();
            var yaw = view.yaw();
            rotationObservable.notify(yaw)
        }
        panoElement.addEventListener('mouseup', mouseupFn);

        function mouseupFn() {
            panoElement.removeEventListener('mousemove', rotateMapFn);
        }
    }

    // Detect whether we are on a touch device.
    document.body.classList.add('no-touch');
    window.addEventListener('touchstart', function () {
        document.body.classList.remove('no-touch');
        document.body.classList.add('touch');
    });

    // Use tooltip fallback mode on IE < 11.
    if (bowser.msie && parseFloat(bowser.version) < 11) {
        document.body.classList.add('tooltip-fallback');
    }

    // Viewer options.
    var viewerOpts = {
        controls: {
            mouseViewMode: APP_DATA.settings.mouseViewMode
        }
    };

    // Initialize viewer.
    var viewer = new Marzipano.Viewer(panoElement, viewerOpts);
    let scene = createScene(currentScene);
    switchScene(scene);

    function createScene(sceneData) {
        var urlPrefix = "tiles";
        var source = Marzipano.ImageUrlSource.fromString(
            "../assets/img/360view/" + urlPrefix + "/" + sceneData.name + "/{z}/{f}/{y}/{x}.jpg", {
                cubeMapPreviewUrl: "../assets/img/360view/" + urlPrefix + "/" + sceneData.name + "/preview.jpg"
            });
        var geometry = new Marzipano.CubeGeometry(sceneData.levels);

        var limiter = Marzipano.RectilinearView.limit.traditional(sceneData.faceSize, 100 * Math.PI / 180, 120 * Math.PI / 180);
        var view = new Marzipano.RectilinearView(sceneData.initialViewParameters, limiter);

        var scene = viewer.createScene({
            source: source,
            geometry: geometry,
            view: view,
            pinFirstLevel: true
        });

        // Create link hotspots.
        sceneData.linkHotspots.forEach(function (hotspot) {
            var element = createLinkHotspotElement(hotspot);
            scene.hotspotContainer().createHotspot(element, {
                yaw: hotspot.yaw,
                pitch: hotspot.pitch
            });
        });

        // Create info hotspots.
        sceneData.infoHotspots.forEach(function (hotspot) {
            var element = createInfoHotspotElement(hotspot);
            scene.hotspotContainer().createHotspot(element, {
                yaw: hotspot.yaw,
                pitch: hotspot.pitch
            });
        });

        return {
            data: sceneData,
            scene: scene,
            view: view
        };
    }

    // Set handler for scene list toggle.
    mapListToggleElement.addEventListener('click', togglemapList);

    function sanitize(s) {
        return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;');
    }

    function switchScene(scene) {
        scene.view.setParameters(scene.data.initialViewParameters);
        scene.scene.switchTo();
        updateSceneName(scene);
        //updatemapList(scene);
    }

    function updateSceneName(scene) {
        // sceneNameElement.innerHTML = sanitize(scene.data.id);
        sceneNameElement.innerHTML = scene.data.id;
    }

    function updatemapList(scene) {
        for (var i = 0; i < sceneElements.length; i++) {
            var el = sceneElements[i];
            if (el.getAttribute('data-id') === scene.data.id) {
                el.classList.add('current');
            } else {
                el.classList.remove('current');
            }
        }
    }

    function showmapList() {
        mapListElement.classList.add('enabled');
        mapListToggleElement.classList.add('enabled');
    }

    function hidemapList() {
        mapListElement.classList.remove('enabled');
        mapListToggleElement.classList.remove('enabled');
    }

    //***------------- */
    togglemapList();

    function togglemapList() {
        mapListElement.classList.toggle('enabled');
        mapListToggleElement.classList.toggle('checked-map');

        if (mapListElement.classList.contains('enabled')) {
            mapListElement.style.transform = `translateX(100%)`;
        } else {
            mapListElement.style.transform = `translateX(0)`;
        }
        mapListToggleElement.classList.toggle('enabled');
    }

    function createLinkHotspotElement(hotspot) {

        // Create wrapper element to hold icon and tooltip.
        var wrapper = document.createElement('div');
        wrapper.classList.add('hotspot');
        wrapper.classList.add('link-hotspot');

        // Create image element.
        var icon = document.createElement('img');
        icon.src = 'img/link.png';
        icon.classList.add('link-hotspot-icon');

        // Set rotation transform.
        var transformProperties = ['-ms-transform', '-webkit-transform', 'transform'];
        for (var i = 0; i < transformProperties.length; i++) {
            var property = transformProperties[i];
            icon.style[property] = 'rotate(' + hotspot.rotation + 'rad)';
        }

        // Add click event handler.
        wrapper.addEventListener('click', function () {
            switchScene(findSceneById(hotspot.target));
        });

        // Prevent touch and scroll events from reaching the parent element.
        // This prevents the view control logic from interfering with the hotspot.
        stopTouchAndScrollEventPropagation(wrapper);

        // Create tooltip element.
        var tooltip = document.createElement('div');
        tooltip.classList.add('hotspot-tooltip');
        tooltip.classList.add('link-hotspot-tooltip');
        tooltip.innerHTML = findSceneDataById(hotspot.target).name;

        wrapper.appendChild(icon);
        wrapper.appendChild(tooltip);

        return wrapper;
    }

    function createInfoHotspotElement(hotspot) {

        // Create wrapper element to hold icon and tooltip.
        var wrapper = document.createElement('div');
        wrapper.classList.add('hotspot');
        wrapper.classList.add('info-hotspot');

        // Create hotspot/tooltip header.
        var header = document.createElement('div');
        header.classList.add('info-hotspot-header');

        // Create image element.
        var iconWrapper = document.createElement('div');
        iconWrapper.classList.add('info-hotspot-icon-wrapper');
        var icon = document.createElement('img');
        icon.src = 'img/info.png';
        icon.classList.add('info-hotspot-icon');
        iconWrapper.appendChild(icon);

        // Create title element.
        var titleWrapper = document.createElement('div');
        titleWrapper.classList.add('info-hotspot-title-wrapper');
        var title = document.createElement('div');
        title.classList.add('info-hotspot-title');
        title.innerHTML = hotspot.title;
        titleWrapper.appendChild(title);

        // Create close element.
        var closeWrapper = document.createElement('div');
        closeWrapper.classList.add('info-hotspot-close-wrapper');
        var closeIcon = document.createElement('img');
        closeIcon.src = 'img/close.png';
        closeIcon.classList.add('info-hotspot-close-icon');
        closeWrapper.appendChild(closeIcon);

        // Construct header element.
        header.appendChild(iconWrapper);
        header.appendChild(titleWrapper);
        header.appendChild(closeWrapper);

        // Create text element.
        var text = document.createElement('div');
        text.classList.add('info-hotspot-text');
        text.innerHTML = hotspot.text;

        // Place header and text into wrapper element.
        wrapper.appendChild(header);
        wrapper.appendChild(text);

        // Create a modal for the hotspot content to appear on mobile mode.
        var modal = document.createElement('div');
        modal.innerHTML = wrapper.innerHTML;
        modal.classList.add('info-hotspot-modal');
        document.body.appendChild(modal);

        var toggle = function () {
            wrapper.classList.toggle('visible');
            modal.classList.toggle('visible');
        };

        // Show content when hotspot is clicked.
        wrapper.querySelector('.info-hotspot-header').addEventListener('click', toggle);

        // Hide content when close icon is clicked.
        modal.querySelector('.info-hotspot-close-wrapper').addEventListener('click', toggle);

        // Prevent touch and scroll events from reaching the parent element.
        // This prevents the view control logic from interfering with the hotspot.
        stopTouchAndScrollEventPropagation(wrapper);

        return wrapper;
    }

    // Prevent touch and scroll events from reaching the parent element.
    function stopTouchAndScrollEventPropagation(element, eventList) {
        var eventList = ['touchstart', 'touchmove', 'touchend', 'touchcancel', 'wheel', 'mousewheel'];
        for (var i = 0; i < eventList.length; i++) {
            element.addEventListener(eventList[i], function (event) {
                event.stopPropagation();
            });
        }
    }

    function findSceneById(id) {
        for (var i = 0; i < scenes.length; i++) {
            if (scenes[i].data.id === id) {
                return scenes[i];
            }
        }
        return null;
    }

    function findSceneDataById(id) {
        for (var i = 0; i < data.scenes.length; i++) {
            if (data.scenes[i].id === id) {
                return data.scenes[i];
            }
        }
        return null;
    }

    //OBS
    switchPhoto360Observable.subscribe((data) => {
        currentScene = tails.find(scene => scene.name == pointName)
        let scene = createScene(currentScene);
        switchScene(scene);
    });

})();