let header, footer, container;
let level, floorSrc, coverSrc, set, svg, svgHeight, floorLayer, mainLayer, floor;
let zoom;
let aside;
let isAsideVis;
let asideContent;
let setFlagObj = {};
let transform = {
    zoom: {
        x: 0,
        y: 0,
        k: 1
    },
    x: 0,
    y: 0,
    initPicWidth: 3000,
    initPicH: 1850,
    k: 0
}
let oldScale = 1;
let clusterInitObj = [200, 0];

let setsToShow = [];
let pointsOnLevel;
let subLevelToShow = 'sub_0';
let pinSize;

let isFirstFloorLoading = true;
let highlghtedVisible = false;
let currentCluster;
let subLevelData;
let subLevel;

window.onload = onloadFn;

function defineData4Floor() {
    let paramsString = window.location.search;
    let searchParams = new URLSearchParams(paramsString);
    isAsideVis = searchParams.get("isAsideVis") || 1;
    level = searchParams.get("level");
    subLevel = getSubLevel(level);
    if(subLevel.isSub) {
        floorSrc = `../assets/img/level/${level}_${subLevelToShow}.png`;
    } else {
        floorSrc = `../assets/img/level/${level}.png`;
    }    
    pointsOnLevel = points.filter(point => point.level === level);
}

function onloadFn() {
    defineData4Floor();
    header = document.querySelector(".header");
    footer = document.querySelector(".footer");
    container = document.getElementById("container");
    let showHideBtn = document.querySelector(".hideAside");
    showHideBtn.addEventListener('click', toggleAsideFn);
    let asideSvg = document.getElementById('asideSvg');    
    
    if(subLevel.isSub) {
        console.log('subLevel.edge', subLevel.edge)
        let subLevelImg = `../assets/img/level/sub_${level}.svg`;
        asideSvg.setAttribute('data', subLevelImg);

        asideSvg.onload = function() {
            asideSvg.style.opacity = 1;
            asideContent = asideSvg.contentDocument;
            reColorizeSubFloor(subLevelToShow);
            let floorRect = [...asideContent.querySelectorAll('.block')];
            floorRect.forEach(singleBlock => {
                singleBlock.addEventListener('click', clickSubFloor);
                singleBlock.addEventListener('mouseenter', mouseOverSubFloor);
                singleBlock.addEventListener('mouseleave', mouseLeaveSubFloor);
            })
        }        
    } else {
        let aside = document.querySelector('.aside');
        aside.style.display = 'none';
    }    

    window.addEventListener("resize", resize);
    resize();
    buildSvg();
}

function mouseLeaveSubFloor() {
    this.style.fill = 'none';
    this.style.cursor = 'inherit';
}

function toggleAsideFn() {
    let aside = document.querySelector('.aside');
    if(isAsideVis == 1) {
        showHideAside(aside);
        shevronAnimation(aside);
    } else {
        shevronAnimation(aside);
    }  
    isAsideVis = 1;
    
}

function showHideAside(aside, toHide = false) {
    if(toHide) {
        aside.classList.add('hide');
    } else {
        aside.classList.toggle('hide');
    }
}

function shevronAnimation(aside) {
    let shevron = document.querySelector('.shevron');
    let hideAside = document.querySelector('.hideAside')
    let angle = 180;
    let hideSidePosition = 3;
    if(aside.classList.contains('hide')) {
        angle = 0;
        hideSidePosition = -48;
    }    
    shevron.setAttribute("style", "transform: rotate(" + angle + "deg)");
    hideAside.style.left = hideSidePosition + 'px';
}

function mouseOverSubFloor() {
    this.style.fill = 'rgba(0,0,0,0.2)';
    this.style.cursor = 'pointer';
}

function clickSubFloor(e) {
    if(mainLayer) {
        mainLayer
            .attr("opacity", "0");
    }
    
    //document.body.style.opacity = 0;
    deleteSet('svg', '.set');
    deleteSet('svg', '.showTiedPins');    
    
    subLevelToShow = e.target.id;
    reColorizeSubFloor(subLevelToShow);

    floorSrc = `../assets/img/level/${level}_${subLevelToShow}.png`;
    floor.attr("href", floorSrc);

    let pointsArr;
    if (subLevel.isSub) {
        pointsArr = pointsOnLevel.filter(item => subLevelToShow === "sub_0" ? item.z_real < subLevel.edge : item.z_real > subLevel.edge);
    } else {
        pointsArr = pointsOnLevel;
    }

    let sensitive = defineSensitiveOnCurrentZoom(oldScale, clusterInitObj);
    let dataForClusters = clusterize(pointsArr, sensitive);
    pinSize = oldScale <=1.6 ? "big":"small";
    drawSet(dataForClusters, pinSize);
}

function defineSensitiveOnCurrentZoom(scale, clusterInitObj) {
    let sensitive;
    if (scale <= 1.6) {
        sensitive = clusterInitObj[0]
    // } else if (oldScale > 1.5 && oldScale <= 2) {
    //     sensitive = clusterInitObj[1]
    } else {
        sensitive = clusterInitObj[1]
    }
    return sensitive;
}

function resize() {
    let headerFooterHeight = header.offsetHeight + footer.offsetHeight;
    let wHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    let wWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    let svgHeight = wHeight - headerFooterHeight;

    if (wWidth > svgHeight * transform.initPicWidth / transform.initPicH) {
        transform.k = svgHeight / transform.initPicH;
        transform.x = (wWidth / transform.k - transform.initPicWidth) / 2;
        transform.y = 0;
    } else {
        transform.k = wWidth / transform.initPicWidth;
        transform.x = 0;
        transform.y = (svgHeight / transform.k - transform.initPicH) / 2;
    }
    container.style.height = `${svgHeight}px`;
    container.style.width = `${wWidth}px`;

    if (mainLayer) {
        mainLayer
            .attr("transform", `translate(${transform.zoom.x},${transform.zoom.y}) scale(${transform.k*transform.zoom.k}) translate(${transform.x},${transform.y})`);
    }
}

function getSubLevel(level) {
    return sublevels.find(lvl => lvl.level === level);
}

function buildSvg() {
    svg = d3.select("#container").append("svg");
    svg
        .attr("class", "svgContainer")
        .attr("height", "100%")
        .attr("width", "100%");

    mainLayer = svg.append("g");
    mainLayer
        .attr("class", "mainLayer")
        .attr("opacity", "0")
        .attr("transform", `scale(${transform.k}) translate(${transform.x},${transform.y})`)

    floorLayer = mainLayer.append("g")
    floorLayer
        .attr("class", "floorLayer")
        .on('click', () => {
            if (svg.select('showTiedPins')) deleteSet('svg', '.showTiedPins');
            let aside = document.querySelector('.aside');
            if(!aside.classList.contains('hide')) {
                let asideBtn = document.querySelector('.hideAside');
                showHideAside(aside, true);
                shevronAnimation(aside, asideBtn);
            }            
            currentCluster = null;
        })
    floor = floorLayer.append("image");
    floor.attr("class", "currentFloor");
    floor.attr("href", floorSrc);
    floor.on("load", () => {        

        mainLayer
            .transition()
            .duration(400)
            .attr("opacity", "1");

        if(isFirstFloorLoading) {
            document.body.style.opacity = 1;
            let pointsArr = subLevel.isSub ? getSubPoints(subLevelToShow, pointsOnLevel, subLevel.edge) : pointsOnLevel;
            let currentSet = clusterize(pointsArr, clusterInitObj[0]);
            toggleAsideFn();
            drawSet(currentSet, 'big');
            isFirstFloorLoading = false
        }
    });
    // mainLayer
    //     .transition()
    //     .duration(500)
    //     .attr("opacity", "1");

    zoom = d3.zoom()
        .scaleExtent([0.3, 10])
        .on("zoom", () => {
            deleteSet('svg', '.showTiedPins');
            zoomed();
            rebuildClusters();
        });
    svg.call(zoom);
    //d3.select("svg").on("dblclick.zoom", null);
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

function rebuildClusters() {
    let scale = d3.zoomTransform(svg.node()).k;
    if (scale.toFixed(1) === oldScale.toFixed(1)) return;
    oldScale = scale;
    deleteSet('svg', '.set');

    let pointsArr = subLevel.isSub ? getSubPoints(subLevelToShow, pointsOnLevel, subLevel.edge) : pointsOnLevel;
    let sensitive = defineSensitiveOnCurrentZoom(scale, clusterInitObj)
    let dataForClusters = clusterize(pointsArr, sensitive);
    pinSize = oldScale <=1.6 ? "big":"small";

    drawSet(dataForClusters, pinSize);
}

function drawSet(currentSet, sizePoint = "big") {
    set = mainLayer.append("g");
    set.attr("class", "set")
        .selectAll("g")
        .data(currentSet)
        .join("g")
        .attr("pointer-events", "visible")
        .attr("cursor", "pointer")
        .attr("id", d => d.name)
        .append("circle")
        .attr("fill", d => d.pointsCopy.length > 1 ? "#00BD63" : "#FF2A2A")
        .attr("cx", d => d.centroid.x)
        .attr("cy", d => d.centroid.y)
        .attr("r", d => d.pointsCopy.length > 1 ? 43 : sizePoint === "big" ? 25 : 15)
        .on("click", clickedOnPin)
    set
        .selectAll("g")
        .data(currentSet)
        .join("g")
        .append("text")
        .attr("x", d => d.centroid.x)
        .attr("y", d => d.centroid.y + 3)
        .attr("text-anchor", "middle")
        .attr("font-size", d => d.pointsCopy.length > 1 ? 48 : sizePoint === "big" ? 20 : 12)
        .attr("fill", "white")
        .attr("font-family", "sans-serif")
        .attr("dy", d => d.pointsCopy.length > 1 ? "12" : sizePoint === "big" ? "3" : "1")
        .attr("dx", d => d.pointsCopy.length > 1 ? "-1" : sizePoint === "big" ? "0" : "0")
        .attr("pointer-events", "none")
        .text(d => d.pointsCopy.length > 1 ? d.pointsCopy.length : d.pointsCopy[0].name);
}

function reColorizeSubFloor(subLevelToShow) {
    let blocks = [...asideContent.querySelectorAll('.block')];
    blocks.forEach(block => {
        block.style.stroke = 'none';
    });
    
    let clickedBlock = asideContent.querySelector(`.${subLevelToShow}`);
    clickedBlock.style.stroke = '#fff64d';
    clickedBlock.style.strokeWidth = 5;
}

function showTiedPins(d, isBuild) {
    if (d.pointsCopy.length === 1) return;
    if (!isBuild) {
        deleteSet('svg', '.showTiedPins');
    }
    if (isBuild) {
        svg
            .select('.mainLayer')
            .append('g')
            .attr('class', 'showTiedPins')
            .selectAll('circle')
            .data(d.pointsCopy)
            .join("circle")
            .attr('cx', d => d.x_img)
            .attr('cy', d => d.y_img)
            .attr('pointer-events', 'visible')
            .attr('r', 25)
            .attr('fill', "#FF2A2A")
            .attr("cursor", "pointer")
            .on("click", clickedOnshowTiedPinsed)

        svg
            .select('.mainLayer')
            .append('g')
            .attr('class', 'showTiedPins')
            .selectAll('g')
            .data(d.pointsCopy)
            .join("g")
            .append("text")
            .attr("x", d => d.x_img)
            .attr("y", d => d.y_img + 3)
            .attr("text-anchor", "middle")
            .attr("font-size", 20)
            .attr("fill", "white")
            .attr("font-family", "sans-serif")
            .attr("dy", 3)
            .attr("dx", 0)
            .attr("pointer-events", "none")
            .text(d => d.name);
    }
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

function clickedOnshowTiedPinsed(d) {
    let {
        name,
        phase
    } = d;
    let subQuery = subLevel.isSub ? subLevelToShow : "_";
    window.open("../360view/index.html?level=" + level + "&sub=" + subQuery + "&name=" + name + "&phase=" + phase, "_self");
}

function clickedOnPin(d) {
    let points = d.pointsCopy;
    if (points.length === 1) {
        let {
            name,
            phase
        } = points[0];
        let subQuery = subLevel.isSub ? subLevelToShow : "_";
        window.open("../360view/index.html?level=" + level + "&sub=" + subQuery + "&name=" + name + "&phase=" + phase, "_self");
    } else {
        deleteSet('svg', '.showTiedPins');
        let aside = document.querySelector('.aside');
        if(!aside.classList.contains('hide')) {
            let asideBtn = document.querySelector('.hideAside');
            showHideAside(aside, true);
            shevronAnimation(aside, asideBtn);
        }

        if (currentCluster === d.id) {
            
            currentCluster = null;
        } else {
            showTiedPins(d, true);
            currentCluster = d.id;
        }
    }
};

function centerizeFn() {
    svg
        .transition()
        .duration(400)
        .call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1));
}

function zoomed() {
    let {
        k,
        x,
        y
    } = d3.event.transform;

    let transform2 = d3Transform()
        .translate([x, y])
        .scale(k * transform.k)
        .translate([transform.x, transform.y]);
    mainLayer.attr("transform", transform2);

    transform.zoom = {
        x,
        y,
        k
    };
}