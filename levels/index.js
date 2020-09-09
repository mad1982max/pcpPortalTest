let obj;
let resizeDebounce = debounce(resizeFn, 250);
let oldFloor;

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
    //document.body.style.opacity = 0;

    let header = document.querySelector('.header');
    let footer = document.querySelector('.footer');
    
    let headerFooterHeight = header.offsetHeight + footer.offsetHeight;
    let h = window.innerHeight || document.documentElement.clientHeight ||
        document.body.clientHeight;
    let w = window.innerWidth || document.documentElement.clientWidth ||
        document.body.clientWidth;
    let currentFloor = w < 600 && w < h ? "small" : "big"
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
    this.style.fill = 'rgba(0,0,0,0.2)';
    this.style.stroke = 'rgba(255, 247, 115)';
    this.style.strokeWidth = 3;
    this.style.cursor = 'pointer';

    let svgDocument = obj.contentDocument;
    let deck = svgDocument.querySelector(`#pl_${hoverFloor}`);
    deck.style.fill = 'rgb(255, 247, 115, 0.4)'
    deck.style.stroke = 'rgba(255, 247, 115)';
    deck.style.strokeWidth = 3;

}

function clickBack() {
    setTimeout(function () {
        document.location.href = `../index.html`
    }, 250);
}

function clickFloor(e) {
    let level = e.target.id;
    console.log('goTo: ', level);
    setTimeout(function () {
        document.location.href = `../level/index.html?level=${level}`
    }, 250);
}