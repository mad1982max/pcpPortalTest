let obj, oldFloor;
let resizeDebounce = debounce(resizeFn, 250);

const style = {
    hoverFillColor: 'rgba(0,0,0,0.2)',
    hoverStrokeColor: 'rgba(255, 247, 115)',
    deckFillColor: 'rgba(255, 247, 115, 0.4)',
    deckStrokeColor: 'rgba(255, 247, 115)',
    strokeWidth: 3
};
const widthEdge = 600;

window.onload = function () {    
    obj = document.getElementById('svg');
    resizeFn();

    window.addEventListener('resize', () => {
        document.body.style.opacity = 0;
        resizeDebounce();
    });
    
    obj.onload = function () {
        let svgDocument = obj.contentDocument;
        let img = svgDocument.querySelector('.floor');
        img.setAttribute('width', '100%');

        let floorRect = [...svgDocument.querySelectorAll('.block')];
        floorRect.forEach(singleBlock => {
            singleBlock.addEventListener('click', clickFloor);
            singleBlock.addEventListener('mouseenter', mouseOverFloor);
            singleBlock.addEventListener('mouseleave', mouseLeave);
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


function resizeFn() {
    let header = document.querySelector('.header');
    let footer = document.querySelector('.footer');
    
    let headerFooterHeight = header.offsetHeight + footer.offsetHeight;
    let h = window.innerHeight || document.documentElement.clientHeight ||
        document.body.clientHeight;
    let w = window.innerWidth || document.documentElement.clientWidth ||
        document.body.clientWidth;
    let currentFloor = w < widthEdge && w < h ? "small" : "big"
    if (currentFloor !== oldFloor) {
        obj.setAttribute('data', `../assets/img/levels/levels_${currentFloor}.svg`);
        oldFloor = currentFloor;
    }
    let hSVG = h - headerFooterHeight;
    obj.style.height = hSVG + 'px';
    document.body.style.opacity = 1;
}

function mouseLeave() {
    this.style.fill = 'none';
    this.style.stroke = 'none';

    let hoverFloor = this.id.split('.')[0];
    let svgDocument = obj.contentDocument;
    let deck = svgDocument.querySelector(`#pl_${hoverFloor}`);
    deck.style.fill = 'none';
    deck.style.stroke = 'none';
}

function mouseOverFloor() {
    
    let hoverFloor = this.id.split('.')[0];
    this.style.fill = style.hoverFillColor;
    this.style.stroke = style.hoverStrokeColor;
    this.style.strokeWidth = style.strokeWidth;
    this.style.cursor = 'pointer';

    let deck = obj.contentDocument.querySelector(`#pl_${hoverFloor}`);
    deck.style.fill = style.deckFillColor;
    deck.style.stroke = style.deckStrokeColor;
    deck.style.strokeWidth = style.strokeWidth;
}

function clickBack() {
    setTimeout(function () {
        document.location.href = `../index.html`
    }, 250);  // IOS
}

function clickFloor(e) {
    const level = e.target.id;
    setTimeout(function () {
        document.location.href = `../level/index.html?level=${level}`
    }, 250);
}