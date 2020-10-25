let level, floorSrc, svg, mainLayer, floor;
let isAsideVis, pointsOnLevel, currentCluster, levelInfo;
let prevScale = 1;
let prevClusterPointId = 0;
let initImgWidth = 3000;
let initImgHeight = 1850;
let minScale = 0.3;
let maxScale = 10;
let singlePinColor = "#FF2A2A";
let clusterPinColor = "#00BD63";
let defaultSubLevelToShow = 'sub_0';
let isFirstFloorLoading = true;
let asideVisible = false;

let subFloorStyle = {
    hoverFillColor: 'rgba(0,0,0,0.2)',
    hoverStrokeColor: '#fff64d',
    hoverStrokeWidth: 5
}

let clusterdata = [{
        clusterPointId: 0,
        sensivity: 200,
        minScale: minScale,
        maxScale: 1.6,
        rCuster: 43,
        textCluster: 48,
        rPin: 25,
        textPin: 20,
        dyTextCluster: 14,
        dyTextPin: 6
    },
    {
        clusterPointId: 1,
        sensivity: 0,
        minScale: 1.6,
        maxScale: maxScale,
        rCuster: 43,
        textCluster: 20,
        rPin: 15,
        textPin: 12,
        dyTextCluster: 12,
        dyTextPin: 4
    }
]

//----------------------------------------------------------------
window.onload = onloadFn;

function defineData4Floor() {
    const paramsString = window.location.search;
    const searchParams = new URLSearchParams(paramsString);
    asideVisible = searchParams.get("isAsideVis") || 1;
    currentSubLevelToShow = searchParams.get("sub") || defaultSubLevelToShow;
    level = searchParams.get("level");
    levelInfo = levelsEdgeInfo.find(item => item.levelName == level);
    floorSrc = floorSrcFn(level, levelInfo.isSub, currentSubLevelToShow);
    pointsOnLevel = getPointOnLevel(points, levelInfo, currentSubLevelToShow);    
}

function floorSrcFn(level, isSubLevelExist, currentSubLevelToShow) {
    let tail = isSubLevelExist ? `_${currentSubLevelToShow}` : "";
    return `../assets/img/level/${level}${tail}.png`
}

function getPointOnLevel(points, level, sub) {
    if ((!level.isSub && sub !== "sub_0") || !level[sub]) {
        console.log('**subLevel not exist on this level. sub will be set to default value (sub_0)**');
        sub = "sub_0";
    }
    let levelMeasures = level[sub];
    let pointsOnLevel;

    if (levelMeasures.minH && levelMeasures.maxH) {
        pointsOnLevel = points.filter(item => item.z >= levelMeasures.minH && item.z <= levelMeasures.maxH)
    } else if (levelMeasures.minH && !levelMeasures.maxH) {
        pointsOnLevel = points.filter(item => item.z >= levelMeasures.minH)
    } else if (!levelMeasures.minH && levelMeasures.maxH) {
        pointsOnLevel = points.filter(item => item.z <= levelMeasures.maxH)
    } else {
        console.log('**some error in minH, maxH**');
    }
    return pointsOnLevel
}

function onloadFn() {
    defineData4Floor();
    let showHideBtn = document.querySelector(".hideAsideBtn");

    showHideBtn.addEventListener('click', toggleAsideFn);
    window.addEventListener('resize', resizeFn);

    buildSvg();
    subLevelInit(levelInfo.isSub);
}

function subLevelInit() {
    let aside = document.querySelector('.aside');

    if (levelInfo.isSub) {
        aside.style.opacity = 1;
        let asideSvg = document.getElementById('asideSvg');
        let subLevelImg = `../assets/img/level/sub_${level}.svg`;
        asideSvg.setAttribute('data', subLevelImg);

        asideSvg.onload = function () {
            asideSvg.style.opacity = 1;
            let asideContent = asideSvg.contentDocument;
            reColorizeSubFloor(asideContent, currentSubLevelToShow);
            let floorRect = [...asideContent.querySelectorAll('.block')];
            floorRect.forEach(singleBlock => {
                singleBlock.addEventListener('click', clickSubFloor);
                singleBlock.addEventListener('mouseenter', (e) => hoverColorizeSubFloors(e, true));
                singleBlock.addEventListener('mouseleave', (e) => hoverColorizeSubFloors(e));
            })
        }
    } else {
        console.log('sub level NOT exists');
    }
}

function hoverColorizeSubFloors(e, isHover = false) {
    let element = e.target
    if (isHover) {
        element.style.fill = subFloorStyle.hoverFillColor;
        element.style.cursor = 'pointer';
    } else {
        element.style.fill = 'none';
        element.style.cursor = 'inherit';
    }
}

function toggleAsideFn() {
    let aside = document.querySelector('.aside');
    aside.classList.toggle('hide');
    asideBtnAmimation(aside);
}

function showAsideMap() {
    if (levelInfo.isSub) {
        let aside = document.querySelector('.aside');
        aside.classList.remove("hide")
        asideBtnAmimation(aside)
    }
}

function asideBtnAmimation(aside) {
    let shevron = document.querySelector('.shevron');
    let hideAside = document.querySelector('.hideAsideBtn')
    let angle = 180;
    let hideSidePosition = 3;
    if (aside.classList.contains('hide')) {
        angle = 0;
        hideSidePosition = -48;
    }
    shevron.setAttribute("style", "transform: rotate(" + angle + "deg)");
    hideAside.style.left = hideSidePosition + 'px';
}

function resizeFn() {
    let freeHeight = getNewSvgHeight();
    svg.attr('height', freeHeight)
}

function getNewSvgHeight() {
    let header = document.querySelector('.header');
    let footer = document.querySelector('.footer');
    let headerFooterHeight = header.offsetHeight + footer.offsetHeight;
    let windowHeight = window.innerHeight || document.documentElement.clientHeight ||
        document.body.clientHeight;
    return windowHeight - headerFooterHeight;
}

function buildSvg() {
    let freeHeight = getNewSvgHeight();
    svg = d3.select("#container").append("svg");
    svg
        .attr("class", "svgContainer")
        .attr("viewBox", [0, 0, initImgWidth, initImgHeight])
        .attr("width", "100%")
        .attr("height", freeHeight);

    mainLayer = svg.append("g");
    mainLayer
        .attr("class", "mainLayer")
        .attr("opacity", "0")

    let floorLayer = mainLayer.append("g")
    floorLayer
        .attr("class", "floorLayer")
        .on('click', () => {
            if (svg.select('showPinsInCluster')) deleteSet('svg', '.showPinsInCluster');
        })
    floor = floorLayer.append("image");
    floor.attr("class", "currentFloor");
    floor.attr("xlink:href", floorSrc);
    floor.on("load", () => {
        pointsOnLevel = getPointOnLevel(points, levelInfo, currentSubLevelToShow);

        console.log('level: ', level);
        console.log('currentSubLevelToShow: ', currentSubLevelToShow);
        console.log('pointsOnLevel: ', pointsOnLevel.length);
        console.log('_______');

        let currentClusterData = getCurrentClusterData(prevScale);
        let currentSet = clusterize(pointsOnLevel, currentClusterData.sensivity);
        drawSet(currentSet, currentClusterData);

        mainLayer
            .transition()
            .duration(400)
            .attr("opacity", "1");

        if(asideVisible == 1) showAsideMap();
        
    });

    let zoomObj = d3.zoom()
        .scaleExtent([minScale, maxScale])
        .on("zoom", () => {
            deleteSet('svg', '.showPinsInCluster');
            zoomed();
            rebuildClusters();
        });
    svg.call(zoomObj);
}

function getCurrentClusterData(scale = 1) {
    let currentClusterData;
    for (let item of clusterdata) {
        if (scale > item.minScale && scale < item.maxScale) {
            currentClusterData = item;
            break;
        }
    }
    return currentClusterData
}

function drawSet(currentSet, currentClusterData, setName = 'set') {
    let dataArr = setName !== 'set' ? currentSet.pointsCopy : currentSet
    let set = mainLayer.append("g");
    set.attr("class", setName)
        .selectAll("g")
        .data(dataArr)
        .join("g")
        .attr("pointer-events", "visible")
        .attr("cursor", "pointer")
        .attr("id", d => d.name)
        .append("circle")
        .attr("fill", d => setName === 'set' && d.pointsCopy.length > 1 ? clusterPinColor : singlePinColor)
        .attr("cx", d => setName !== 'set' ? d.x_img : d.centroid.x)
        .attr("cy", d => setName !== 'set' ? d.y_img : d.centroid.y)
        .attr("r", d => setName === 'set' && d.pointsCopy.length > 1 ? currentClusterData.rCuster : currentClusterData.rPin)
        .on("click", clickedOnPin)
    set
        .selectAll("g")
        .data(dataArr)
        .join("g")
        .append("text")
        .attr("x", d => setName !== 'set' ? d.x_img : d.centroid.x)
        .attr("y", d => setName !== 'set' ? d.y_img : d.centroid.y)
        .attr("text-anchor", "middle")
        .attr("font-size", d => setName === 'set' && d.pointsCopy.length > 1 ? currentClusterData.textCluster : currentClusterData.textPin)
        .attr("fill", "white")
        .attr("font-family", "sans-serif")
        .attr("dy", d => setName === 'set' && d.pointsCopy.length > 1 ? currentClusterData.dyTextCluster : currentClusterData.dyTextPin)
        .attr("dx", d => setName === 'set' ? d.pointsCopy.length > 1 ? -1 : 0 : -1)
        .attr("pointer-events", "none")
        .text(d => setName === 'set' ? d.pointsCopy.length > 1 ? d.pointsCopy.length : d.pointsCopy[0].name : d.name);
}

function zoomed() {
    let transform = d3.event.transform;
    mainLayer.attr("transform", transform);
}

function deleteSet(base, selector) {
    let element;
    if (base === "doc") {
        element = document.querySelector(selector);
    } else if (base === "svg") {
        element = svg.selectAll(selector);
    }
    if (element) element.remove();
}

function rebuildClusters() {
    let currentScale = d3.event.transform.k;
    if (currentScale.toFixed(2) === prevScale.toFixed(2)) return;
    prevScale = currentScale;

    let currentClusterData = getCurrentClusterData(currentScale);
    if (currentClusterData.clusterPointId === prevClusterPointId) return

    console.log('--rebuild--');
    prevClusterPointId = currentClusterData.clusterPointId

    deleteSet('svg', '.set');
    let currentSet = clusterize(pointsOnLevel, currentClusterData.sensivity);
    drawSet(currentSet, currentClusterData);
}

function clickedOnPin(d) {
    let cluster = d.pointsCopy;
    if (!cluster || cluster.length === 1) {
        let array = !cluster ? d : cluster[0];
        let query = buildQueryString(array, levelInfo.isSub, currentSubLevelToShow);
        console.log(query);
        window.open(query, "_self");
    } else {
        deleteSet('svg', '.showPinsInCluster');
        let currentClusterData = getCurrentClusterData(prevScale);
        drawSet(d, currentClusterData, "showPinsInCluster");
        currentCluster = d.id;
    }
};

function buildQueryString(pointObj, isSubFlag, subLevelToShow) {
    let {
        name
    } = pointObj;
    let subQuery = isSubFlag ? subLevelToShow : "sub_0";
    let queryString = "../360view/index.html?level=" + level + "&sub=" + subQuery + "&name=" + name;
    return queryString;
}

function reColorizeSubFloor(asideContent, subLevelToShow) {
    let blocks = [...asideContent.querySelectorAll('.block')];
    blocks.forEach(block => {
        block.style.stroke = 'none';
    });
    let clickedBlock = asideContent.querySelector(`.${subLevelToShow}`);
    clickedBlock.style.stroke = subFloorStyle.hoverStrokeColor;
    clickedBlock.style.strokeWidth = subFloorStyle.hoverStrokeWidth;
}

function clickSubFloor(e) {
    if (mainLayer) {
        mainLayer
            .attr("opacity", "0");
    }
    deleteSet('svg', '.set');
    deleteSet('svg', '.showPinsInCluster');
    currentSubLevelToShow = e.target.id;
    let asideContent = document.getElementById('asideSvg').contentDocument;
    reColorizeSubFloor(asideContent, currentSubLevelToShow);

    floorSrc = `../assets/img/level/${level}_${currentSubLevelToShow}.png`;
    floor.attr("xlink:href", floorSrc);
}