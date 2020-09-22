'use strict';
let pointName, level, sub, zoomFn;
let floorSrc, set, svg, mainLayer;
let pointsOnLevel, currentScene;

let tooltip = {
    defaultColor: "#FF2A2A",
    checkedColor: "#00b359",
    defaultR: 15,
    checkedR: 25
}

const mapInit = {
    mapWidthEdge1: 400,
    screenEdge1: 500,
    screenEdge2: 800,
    mult: 1.5
}

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


defineData4Floor();

function defineData4Floor() {
    const paramsString = window.location.search;
    const searchParams = new URLSearchParams(paramsString);
    level = searchParams.get('level');
    pointName = searchParams.get('name');
    sub = searchParams.get('sub');
    let tail = sub !== "_" ? `_${sub}` : "";
    floorSrc = `../assets/img/level/${level}${tail}.png`;

    let allPointsOnGlobLevel = points.filter(point => point.level === level);
    let currentLevelObj = getCurrentLevel(level);
    pointsOnLevel = sub !== "_" ? getSubPoints(sub, allPointsOnGlobLevel, currentLevelObj.edge) : allPointsOnGlobLevel;
    currentScene = tails.find(scene => scene.name == pointName);
}

function getCurrentLevel(level) {
    return sublevels.find(lvl => lvl.level === level);
}

function makeResizableMapWrapper(div) {
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

        let {
            height,
            width,
            left,
            top
        } = element.getBoundingClientRect();
        original_height = height;
        original_width = width;
        original_x = left;
        original_y = top;

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
        if (width >= mapInit.mapWidthEdge1) {
            element.style.width = width + 'px';
            element.style.height = height + 'px';
        } else {
            element.style.width = mapInit.mapWidthEdge1 + 'px';
        }
        resizeSVG();
        centerizeFn();
    }

    function stopResize() {
        window.removeEventListener('mousemove', resizeByDrag);
        window.removeEventListener('touchmove', resizeByDrag);
    }
}

window.onload = onloadFn;

function onloadFn() {
    document.body.style.opacity = 1;
    makeResizableMapWrapper('#mapList');

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

    window.addEventListener("orientationchange", function (e) {
        document.body.style.opacity = 0;
        window.location.reload();
    });

    window.addEventListener('resize', resizeSVG);
    initMapWidth();
    buildSvg();
    resizeSVG();
}

function initMapWidth() {
    let sceneList = document.querySelector('#mapList');
    if (window.innerWidth < mapInit.screenEdge1) {
        sceneList.style.width = window.innerWidth + 'px';
        sceneList.style.height = window.innerWidth / currentRatioImgData.initPicWidth * currentRatioImgData.initPicHeight + 'px';
    } else {
        let multer = window.innerWidth > mapInit.screenEdge1 && window.innerWidth < mapInit.screenEdge2 ? 1 : mapInit.mult;
        let newWidth = mapInit.mapWidthEdge1 * multer;
        sceneList.style.width = newWidth + 'px';
        sceneList.style.height = newWidth / currentRatioImgData.initPicWidth * currentRatioImgData.initPicHeight + 'px';
    }
}

function centerizeFn() {
    svg
        .transition()
        .duration(400)
        .call(zoomFn.transform, d3.zoomIdentity.translate(0, 0).scale(1));
}

function changeStairsFn(counter) {
    let currentFloorIndex = sublevels.findIndex(lvl => lvl.level === level);
    sub = nextSubFloor(sub, counter);
    deleteSet('svg', '.set');
    let tail;

    if (sub === "_") {
        let nextLevel = sublevels[currentFloorIndex + counter];
        if (!nextLevel) nextLevel = sublevels[0];
        level = nextLevel.level;

        if (nextLevel.isSub) {
            sub = counter < 0 ? "sub_1" : "sub_0";
            let allPointsOnGlobLevel = points.filter(point => point.level === level);
            pointsOnLevel = getSubPoints(sub, allPointsOnGlobLevel, nextLevel.edge)
            tail = `_${sub}`;

        } else {
            pointsOnLevel = points.filter(point => point.level === level);
            tail = "";
        }
    } else {
        let allPointsOnGlobLevel = points.filter(point => point.level === level);
        pointsOnLevel = getSubPoints(sub, allPointsOnGlobLevel, sublevels[currentFloorIndex].edge)
        tail = `_${sub}`;
    }

    floorSrc = `../assets/img/level/${level}${tail}.png`;
    svg
        .select('.floorLayer')
        .select('image')
        .attr('xlink:href', floorSrc);

    centerizeFn();
}

function nextSubFloor(sub, counter) {
    if (counter > 0) {
        if (sub == "sub_0") return "sub_1"
    } else {
        if (sub == "sub_1") return "sub_0"
    }
    return "_"
}

function getSubPoints(subFloor, allPoints, edge) {
    let points = [];
    switch (subFloor) {
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
    document.location.href = '../level/index.html?' + 'level=' + level + '&isAsideVis=0';
}

function resizeSVG() {
    let wrapper = document.getElementById('wrapper');
    let sceneList = document.querySelector('#mapList');
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

    let floorLayer = mainLayer.append('g');
    floorLayer
        .attr('class', 'floorLayer')
        .attr('opacity', '0.7');
    let floor = floorLayer.append('image');
    floor.attr('class', 'currentFloor');
    floor.on('load', () => {
        drawSet('set');
        //buildViewCone(0.3);
    });
    floor.attr('xlink:href', floorSrc);
    mainLayer
        .transition()
        .duration(700)
        .attr('opacity', '1');

    zoomFn = d3
        .zoom()
        .scaleExtent([0.3, 10])
        .on('zoom', () => {
            deleteSet('doc', '.tooltip');
            zoomed();
            // redrawPins();
        });
    svg.call(zoomFn);
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

function drawSet(className, isChecked = true) {
    //let currentSet = pointsOnLevel.filter(point => itemToShow === "all" ? true : point.phase === itemToShow);
    if (isChecked) {
        set = mainLayer.append('g')
        set.attr('class', className)
            .selectAll('g')
            .data(pointsOnLevel)
            .join('g')
            .attr('pointer-events', 'visible')
            .attr('cursor', 'pointer')
            .attr('class', d => `_${d.name}`)
            .append('circle')
            .attr('fill', (d) => d.name == pointName ? tooltip.checkedColor : tooltip.defaultColor)
            .attr('cx', d => d.x_img)
            .attr('cy', d => d.y_img)
            .attr('r', (d) => d.name == pointName ? tooltip.checkedR : tooltip.defaultR)
            .on('click', clickedOnPin)
            .on('mousemove', (d) => toolTipFn(d.name))
            .on('mouseleave', (d) => toolTipFn(d.name, false));

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
    reDesignAfterClick('fill', 'circle', tooltip.defaultColor, d3.event.target, tooltip.checkedColor);
    reDesignAfterClick('r', 'circle', tooltip.defaultR, d3.event.target, tooltip.checkedR);
    pointName = d.name;
    switchPhoto360Observable.notify(pointName);
    toolTipFn(d.name);
    //deleteSet('svg', '.view');
    //buildViewCone(5)
};

function changePinFn(counter) {
    let currentPinIndex = pointsOnLevel.findIndex(point => point.name == pointName);
    let nextIndex = currentPinIndex + counter;
    if (nextIndex > pointsOnLevel.length - 1) nextIndex = 0;
    if (nextIndex < 0) nextIndex = pointsOnLevel.length - 1;
    pointName = pointsOnLevel[nextIndex].name;
    switchPhoto360Observable.notify(pointName);
    let target = svg.select(`._${pointName} circle`).node();
    reDesignAfterClick('fill', 'circle', tooltip.defaultColor, target, tooltip.checkedColor);
    reDesignAfterClick('r', 'circle', tooltip.defaultR, target, tooltip.checkedR);
}

function toolTipFn(id, flag = true) {
    deleteSet('doc', '.tooltip');
    if (!flag) return;
    let x = d3.event.pageX;
    let y = d3.event.pageY;
    let posYDelta = 15;
    let posXDelta = window.innerWidth - d3.event.pageX < 50 ? -35 : 15;
    let tooltipElem = document.createElement('div');
    tooltipElem.className = 'tooltip';
    tooltipElem.innerHTML = id;
    tooltipElem.style.left = (x + posXDelta) + 'px';
    tooltipElem.style.top = (y + posYDelta) + 'px';
    tooltipElem.style.backgroundColor = id == pointName ? tooltip.checkedColor : tooltip.defaultColor;
    document.body.append(tooltipElem);
}

rotationObservable.subscribe((data) => {
    //changeView(data/ Math.PI*180);
});


function changeView(angle) {
    let point = pointsOnLevel.find(point => point.name === pointName);
    set
        .select(`._${point.name}`).select('.view')
        .attr('transform', `rotate(${angle} ${point.x_img} ${point.y_img})`)
}

function buildViewCone(angle) {
    let point = pointsOnLevel.find(point => point.name === pointName);
    set
        .select(`._${pointName}`)
        .append('g')
        .attr('class', 'view')
        .append('rect')
        .attr('x', point.x_img - 7.5)
        .attr('y', point.y_img)
        .attr('width', 15)
        .attr('height', 45)
        .attr('fill', 'orange')
}