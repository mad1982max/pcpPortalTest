let svgObj, oldFloorSize;

const style = {
    hoverFillColor: 'rgba(0,0,0,0.2)',
    hoverStrokeColor: 'rgba(255, 247, 115)',
    deckFillColor: 'rgba(255, 247, 115, 0.4)',
    deckStrokeColor: 'rgba(255, 247, 115)',
    strokeWidth: 3
};
const widthEdge = 600;

const resizeDebounce = debounce(resizeWindFn, 250);

window.onload = function () {
    svgObj = document.getElementById('svg');
    resizeWindFn();

    window.addEventListener('resize', () => {
        document.body.style.opacity = 0;
        resizeDebounce();
    });

    svgObj.onload = function () {
        let svgDocument = svgObj.contentDocument;

        let floorRect = [...svgDocument.querySelectorAll('.block')];
        floorRect.forEach(singleBlock => {
            singleBlock.addEventListener('click', clickFloor);
            singleBlock.addEventListener('mouseenter', (event) => colorizeFloors(event, false));
            singleBlock.addEventListener('mouseleave', (event) => colorizeFloors(event));
        })
    };
}

function debounce(func, wait, immediate) {
    let timeout;
    return function () {
        let context = this,
            args = arguments;
        let later = function () {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        let callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
};

function resizeWindFn() {
    setSvgHeight()
    defineCurrentSvgImg()
    document.body.style.opacity = 1;
}

function setSvgHeight() {
    let header = document.querySelector('.header');
    let footer = document.querySelector('.footer');
    let headerFooterHeight = header.offsetHeight + footer.offsetHeight;
    let windowHeight = window.innerHeight || document.documentElement.clientHeight ||
        document.body.clientHeight;
    svgObj.style.height = (windowHeight - headerFooterHeight) + 'px';
}

function defineCurrentSvgImg() {
    let windowWidth = window.innerWidth || document.documentElement.clientWidth ||
        document.body.clientWidth;
    let currentFloorSize = windowWidth < widthEdge ? "small" : "big"
    if (currentFloorSize !== oldFloorSize) {
        let imgString = `../assets/img/levels/levels_${currentFloorSize}.svg`;
        svgObj.setAttribute('data', imgString);
        oldFloorSize = currentFloorSize;
    }
}

function colorizeFloors(event, defaultValue = true) {

    let element = event.target;
    let hoverFloor = element.id.split('.')[0];
    let deck = svgObj.contentDocument.querySelector(`#pl_${hoverFloor}`);

    if (defaultValue) {
        element.style.fill = 'none';
        element.style.stroke = 'none';
        if(deck) {
            deck.style.fill = 'none';
            deck.style.stroke = 'none';
        }

    } else {
        element.style.fill = style.hoverFillColor;
        element.style.stroke = style.hoverStrokeColor;
        element.style.strokeWidth = style.strokeWidth;
        element.style.cursor = 'pointer';

        if(deck) {
            deck.style.fill = style.deckFillColor;
            deck.style.stroke = style.deckStrokeColor;
            deck.style.strokeWidth = style.strokeWidth;
        }
    }
}

function clickBack() {
    setTimeout(function () {
        document.location.href = `../index.html`
    }, 250); // IOS
}

function clickFloor(e) {
    const level = e.target.id;
    setTimeout(function () {
        document.location.href = `../level/index.html?level=${level}`
    }, 250);
}