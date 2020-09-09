'use strict';
let container, tooltipElem, wrapper, currentSceneIndex;
let level, sceneList, floorSrc, wHeight, wWidth, set, svg, svgHeight, floorLayer, mainLayer, miniMap, clickedPin, mapLevel;
let showMiniMapFlag = false;
let defaultColor = "#FF2A2A";
let checkedColor = '#00cc66';
let tooltipPosFlag = false;
let phase;
let zoom;
let sub;
const xs_size = 300;
let oldR = 15;
let newR = 25;
let isFirstLoading = true;

let currentRatioImgData = {
    zoom: {
        x: 0,
        y: 0,
        k: 1
    },
    x: 0,
    y: 0,
    initPicWidth: 3000,
    initPicHeight: 1850,
    initRatio: 3000 / 1850,
    k: 0
}
let pointsOnLevel;
let currentScene;

//define query-----------------------------
defineData4Floor();

function defineData4Floor() {
    var paramsString = window.location.search;
    var searchParams = new URLSearchParams(paramsString);
    level = searchParams.get('level');
    mapLevel = level;
    name = searchParams.get('name');
    phase = searchParams.get('phase'); 
    sub = searchParams.get('sub');
    floorSrc = sub !== "_" ? `../assets/img/level/${level}_${sub}.png` : `../assets/img/level/${level}.png`;
    clickedPin = `${phase}_${name}`;

    let allPointsOnGlobLevel = points.filter(point => point.level === level);
    let currentLevelObj = getCurrentLevel(level);
    pointsOnLevel = sub !== "_" ? getSubPoints(sub, allPointsOnGlobLevel, currentLevelObj.edge) : allPointsOnGlobLevel;        
    currentScene = tails.find(scene => scene.name === clickedPin);
    console.log('sub' , floorSrc)
}
//---end define query------------------
function getCurrentLevel(level) {
    return sublevels.find(lvl => lvl.level === level);
}

//add resizeBtnFn----------------------------------
function makeResizableDiv(div) {
    const element = document.querySelector(div);
    const resizer = document.querySelector('.resizeMapBtn');
    let original_width = 0;
    let original_height = 0;
    let original_x = 0;
    let original_y = 0;
    let original_mouse_x = 0;
    let original_mouse_y = 0;

    function touchStart(e) {

        e.preventDefault();
        e.stopPropagation();
        original_height = element.getBoundingClientRect().height;
        original_width = element.getBoundingClientRect().width;
        original_x = element.getBoundingClientRect().left;
        original_y = element.getBoundingClientRect().top;

        original_mouse_x = e.pageX || e.touches[0].pageX;
        original_mouse_y = e.pageY || e.touches[0].pageY;

        window.addEventListener('mousemove', resizeByDrag);
        window.addEventListener('touchmove', resizeByDrag);
        window.addEventListener('mouseup', stopResize);
        window.addEventListener('touchend', stopResize);
    }

    resizer.addEventListener('mousedown', touchStart);
    resizer.addEventListener('touchstart', touchStart);

    function resizeByDrag(e) {
        const width = original_width - ((e.pageX || (e.touches ? e.touches[0].pageX : 1)) - original_mouse_x);
        const height = width / currentRatioImgData.initPicWidth * currentRatioImgData.initPicHeight;
        if (width >= xs_size) {
            element.style.width = width + 'px';
            element.style.height = height + 'px';
        } else {
            element.style.width = xs_size + 'px';
        }
        resize();
        centerizeFn();
    }

    function stopResize() {
        window.removeEventListener('mousemove', resizeByDrag);
        window.removeEventListener('touchmove', resizeByDrag);
    }

}
//end  resizeBtnFn---------------------------------- 

window.onload = onloadFn;

function onloadFn() {
    document.body.style.opacity = 1;
    makeResizableDiv('#mapList');
    sceneList = document.querySelector('#mapList');
    wrapper = document.getElementById('wrapper');
    let stairsUpBtn = document.getElementById('stairsUpBtn');
    let stairsDownBtn = document.getElementById('stairsDownBtn');
    stairsDownBtn.addEventListener('click', changeStairsFn.bind(null, -1));
    stairsUpBtn.addEventListener('click', changeStairsFn.bind(null, 1));

    let nextBtn = document.getElementById('next');
    let prevBtn = document.getElementById('prev');
    nextBtn.addEventListener('click', changePinFn.bind(null, 1));
    prevBtn.addEventListener('click', changePinFn.bind(null, -1));

    let centerizeMapBtn = document.getElementById('centerizeMapBtn');
    centerizeMapBtn.addEventListener('click', centerizeFn);

    window.addEventListener("orientationchange", function (event) {
        console.log("the orientation of the device is now " + event.target.screen.orientation.angle);
        document.body.style.opacity = 0;
        window.location.reload();
    });

    window.addEventListener('resize', resize);
    initMapWidth();
    buildSvg();
    resize();
}

function initMapWidth() {
    if (window.innerWidth < 500) {
        sceneList.style.width = window.innerWidth + 'px';
        sceneList.style.height = window.innerWidth / currentRatioImgData.initPicWidth * currentRatioImgData.initPicHeight + 'px';
        console.log('sceneList.style.height', sceneList.style.height)
    } else if (window.innerWidth > 500 && window.innerWidth < 800) {
        sceneList.style.width = xs_size + 'px';
        sceneList.style.height = xs_size / currentRatioImgData.initPicWidth * currentRatioImgData.initPicHeight + 'px';
    } else {
        sceneList.style.width = xs_size * 1.5 + 'px';
        sceneList.style.height = xs_size * 1.5 / currentRatioImgData.initPicWidth * currentRatioImgData.initPicHeight + 'px';
    }
}

function centerizeFn() {
    svg
        .transition()
        .duration(400)
        .call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1));
}

function changeStairsFn(counter) {    
    let currentFloorIndex = sublevels.findIndex(lvl => lvl.level === level);
    sub  = nextSubFloor(sub,level, counter);

    if(sub === "_") {
        
        let nextLevel = sublevels[currentFloorIndex + counter];
        if(!nextLevel) nextLevel = sublevels[0];
        deleteSet('svg', '.set');
        level = nextLevel.level;

        if(nextLevel.isSub) {
            sub = counter < 0 ? "sub_1" : "sub_0";
            let allPointsOnGlobLevel = points.filter(point => point.level === level);
            pointsOnLevel = getSubPoints(sub, allPointsOnGlobLevel, nextLevel.edge)
            floorSrc = `../assets/img/level/${level}_${sub}.png`;
            floorLayer
                .select('image')
                .attr('xlink:href', floorSrc);

        } else {
            pointsOnLevel = points.filter(point => point.level === level);
            floorSrc = `../assets/img/level/${level}.png`;
            floorLayer
                .select('image')
                .attr('xlink:href', floorSrc);
        }
    } else {
        deleteSet('svg', '.set');
        let allPointsOnGlobLevel = points.filter(point => point.level === level);
        pointsOnLevel = getSubPoints(sub, allPointsOnGlobLevel, sublevels[currentFloorIndex].edge)
        floorSrc = `../assets/img/level/${level}_${sub}.png`;
        floorLayer
            .select('image')
            .attr('xlink:href', floorSrc);
    }
}

function nextSubFloor(sub, level, counter) {
    if(counter > 0) {
        if(sub == "sub_0") return "sub_1"
    } else {
        if(sub == "sub_1") return "sub_0"
    }
    return "_"
}

function getSubPoints(subFloor, allPoints, edge) {
    let points = [];
    switch(subFloor) {
        case 'sub_0':
            points = allPoints.filter(item => item.z_real < edge);
            break;
        case 'sub_1':
            points = allPoints.filter(item => item.z_real > edge);
            break;
        default:
            console.log('sub_XXX error');
    }
    return points;
}

function returnFn() {
    // let newRef = '../level/index.html' + window.location.search;
    let newRef = '../level/index.html?' + 'level=' + level + '&isAsideVis=0';
    //console.log(newRef, level)
    document.location.href = newRef;
}

function resize() {
    deleteSet('doc', '.tooltip');
    let sceneListW = sceneList.offsetWidth;

    if (sceneListW == window.innerWidth) {
        sceneList.style.height = `${mainLayer.node().getBoundingClientRect().height || sceneListW/currentRatioImgData.initRatio}px`;
        sceneList.style.width = `${mainLayer.node().getBoundingClientRect().width || sceneListW}px`;
    }

    if (sceneListW > wrapper.offsetHeight * currentRatioImgData.initPicWidth / currentRatioImgData.initPicHeight) {
        currentRatioImgData.k = wrapper.offsetHeight / currentRatioImgData.initPicHeight;
        currentRatioImgData.x = (wrapper.offsetWidth / currentRatioImgData.k - currentRatioImgData.initPicWidth) / 2;
        currentRatioImgData.y = 0;
    } else {
        currentRatioImgData.k = wrapper.offsetWidth / currentRatioImgData.initPicWidth;
        currentRatioImgData.x = 0;
        currentRatioImgData.y = (wrapper.offsetHeight / currentRatioImgData.k - currentRatioImgData.initPicHeight) / 5;
    }

    if (mainLayer) {
        mainLayer
            .attr('transform', `translate(${currentRatioImgData.zoom.x},${currentRatioImgData.zoom.y}) scale(${currentRatioImgData.k*currentRatioImgData.zoom.k}) translate(${currentRatioImgData.x},${currentRatioImgData.y})`);
    } else {
        console.log('not exist');
    }

}

function buildSvg() {
    svg = d3.select('#wrapper').append('svg');
    svg
        .attr('class', 'svgContainer')
        .attr('height', '100%')
        .attr('width', '100%');

    mainLayer = svg.append('g');
    mainLayer
        .attr('class', 'mainLayer')
        .attr('opacity', '0')
    //.attr('transform', `scale(${currentRatioImgData.k}) translate(${currentRatioImgData.x},${currentRatioImgData.y})`)

    floorLayer = mainLayer.append('g');
    floorLayer
        .attr('class', 'floorLayer')
        .attr('opacity', '0.7');
    let floor = floorLayer.append('image');
    floor.attr('class', 'currentFloor');
    floor.on('load', () => {
        drawSet('set', "all");
        //buildViewCone(0.3);
    });
    floor.attr('xlink:href', floorSrc);
    mainLayer
        .transition()
        .duration(700)
        .attr('opacity', '1');

    zoom = d3
        .zoom()
        .scaleExtent([0.3, 10])
        .on('zoom', () => {
            deleteSet('doc', '.tooltip');
            zoomed();
            // redrawPins();
        });
    svg.call(zoom);
    //d3.select("svg").on("dblclick.zoom", null);
}

function redrawPins() {
    let scale = d3.zoomTransform(svg.node()).k;
    console.log(scale);
}

function zoomed() {
    //console.log('zoomed');
    let {
        k,
        x,
        y
    } = d3.event.transform;
    let transform2 = d3Transform()
        .translate([x, y])
        .scale(k * currentRatioImgData.k)
        .translate([currentRatioImgData.x, currentRatioImgData.y])
    mainLayer.attr('transform', transform2);

    currentRatioImgData.zoom = {
        x,
        y,
        k
    };
}

function deleteSet(base, selector) {
    let element;
    if (base === "doc") {
        element = document.querySelector(selector)
    } else if (base === "svg") {
        element = svg.select(selector);
    }
    if (element) element.remove();
}

function drawSet(className, itemToShow, isChecked = true) {
    let currentSet = pointsOnLevel.filter(point => itemToShow === "all" ? true : point.phase === itemToShow);
    if (isChecked) {
        set = mainLayer.append('g')
        set.attr('class', className)
            .selectAll('g')
            .data(currentSet)
            .join('g')
            .attr('pointer-events', 'visible')
            .attr('cursor', 'pointer')
            .attr('class', d => `_${d.name}`)
            .append('circle')
            .attr('fill', (d) => d.fullname === clickedPin ? checkedColor : defaultColor)
            .attr('cx', d => d.x_img)
            .attr('cy', d => d.y_img)
            .attr('r', (d) => d.fullname == clickedPin ? newR : oldR)
            .on('click', clickedOnPin)
            .on('mousemove', (d) => toolTipFn(d.name, d.phase))
            .on('mouseleave', (d) => toolTipFn(d.name, d.phase, false));

    } else {
        deleteSet('svg', `.${selector}`);
    }
}

function reDesignAfterClick(selectedAttr, selector, oldValue, singleElem, newValue) {
    set.selectAll(selector).attr(selectedAttr, oldValue);
    if (singleElem.attr) {
        singleElem.attr(selectedAttr, newValue)
    } else {
        singleElem.setAttribute(selectedAttr, newValue);
    }
}

function clickedOnPin(d) {
    reDesignAfterClick('fill', 'circle', defaultColor, d3.event.target, checkedColor);
    reDesignAfterClick('r', 'circle', oldR, d3.event.target, newR);
    clickedPin = d.fullname;
    name = d.name;
    switchPhoto360Observable.notify(clickedPin);
    toolTipFn(d.name, d.phase);
    //deleteSet('svg', '.view');
    //buildViewCone(5)
};

function changePinFn(counter) {
    let currentPinIndex = pointsOnLevel.findIndex(point => point.name == name);
    let nextIndex = currentPinIndex + counter;
    if (nextIndex > pointsOnLevel.length - 1) nextIndex = 0;
    if (nextIndex < 0) nextIndex = pointsOnLevel.length - 1;
    let newPin = pointsOnLevel[nextIndex];
    clickedPin = newPin.fullname;
    name = newPin.name;
    switchPhoto360Observable.notify(clickedPin);
    let target = svg.select(`._${name} circle`).node();
    reDesignAfterClick('fill', 'circle', defaultColor, target, checkedColor);
    reDesignAfterClick('r','circle', oldR, target, newR);
}

function toolTipFn(id, phase, flag = true) {
    deleteSet('doc', '.tooltip');
    if (!flag) return;
    let x = d3.event.pageX;
    let y = d3.event.pageY;
    let posYDelta = 15;
    let posXDelta = window.innerWidth - d3.event.pageX < 50 ? -35 : 15;
    tooltipElem = document.createElement('div');
    tooltipElem.className = 'tooltip';
    tooltipElem.innerHTML = id;
    tooltipElem.style.left = (x + posXDelta) + 'px';
    tooltipElem.style.top = (y + posYDelta) + 'px';
    let fillColor = `${phase}_${id}` == clickedPin ? checkedColor : defaultColor;
    tooltipElem.style.backgroundColor = fillColor;
    document.body.append(tooltipElem);
}

function toolTip(id, phase, actionFlag) {
    if (!actionFlag) {
        deleteSet('doc', '.tooltip');
        return
    }
    if (window.innerWidth - d3.event.pageX < 50) tooltipPosFlag = true;
    createToolTip(id, phase, d3.event.pageX, d3.event.pageY, tooltipPosFlag);
}

rotationObservable.subscribe((data) => {
    //changeView(data/ Math.PI*180);
});


function changeView(angle) {
    let point = pointsOnLevel.find(point => point.fullname === clickedPin);
    set
        .select(`._${point.name}`).select('.view')
        .attr('transform', `rotate(${angle} ${point.x_img} ${point.y_img})`)
}

function buildViewCone(angle) {
    let point = pointsOnLevel.find(point => point.fullname === clickedPin);
    set
        .select(`._${name}`)
        .append('g')
        .attr('class', 'view')
        .append('rect')
        .attr('x', point.x_img - 7.5)
        .attr('y', point.y_img)
        .attr('width', 15)
        .attr('height', 45)
        .attr('fill', 'orange')
}