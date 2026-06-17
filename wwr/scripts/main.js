const min = Math.min;
const max = Math.max;

const W = window.innerWidth; 
const H = window.innerHeight;

function lerp(a,b,t){
    return a+(b-a)*t;
}
function constrain(x,mn,mx){
    x = (x > mx)*mx || x;
    x = (x > mn)*x || mn;//this might fail if x is 0 and min is negative
    return x;
}// branchless hell yeah
function smoothStep(x){
    return x*x*(3-2*x);
}

// handeling the minimizing of the top bar when scrolling up/down
// we doin this in javascript cause firefox, for some reason doent have the scroll() css function.
const style = window.getComputedStyle(document.body);

const minTBH = parseInt(style.getPropertyValue("--minTopBarH")); 
const maxTBH = parseInt(style.getPropertyValue("--maxTopBarH"));
const absMinTBH = parseInt(style.getPropertyValue("--absMinTopBarH"));
const sLen = maxTBH-max(minTBH,~~((absMinTBH/H)*100));

const head = document.getElementById("topBar");
const reserve = document.getElementById('reserveTop');
const imgDiv = document.getElementsByClassName("logo_link")[0];

head.style.height = maxTBH+'vh';
reserve.style.height = maxTBH+'vh';

// slide buttons
let initPos = 0;
let tarPos = 0;
let t = 0;
let running = false;

const cWidth = parseInt(style.getPropertyValue("--slide-card-width"));
const sButtons = document.getElementsByClassName("slide-card");
const rButton = document.getElementById("card-forward");
const lButton = document.getElementById("card-back");

function updateCards(prog){
    for(let i = 0; i < sButtons.length; i++){
        sButtons[i].style.left = prog+i*cWidth + "vw";
    }
}
updateCards(0);
let cProg = 0;
rButton.addEventListener('click', (e) => {
    if(!running && cProg < sButtons.length-1){
        initPos = -(cProg)*cWidth;
        cProg ++;
        tarPos = -cProg*cWidth;
        animCards();
    }

});
lButton.addEventListener('click', (e) => {
    if(!running && cProg > 0){
        initPos = -cProg*cWidth;
        cProg --;
        tarPos = -cProg*cWidth;
        animCards();
    }
});

function animCards(){
    running = true;
    t += 0.01;
    if(t > 1){
        t = 1;
    }
    updateCards(lerp(initPos,tarPos,smoothStep(t)));
    if(t === 1){
        running = false;
        t = 0;
        return;
    }
    window.requestAnimationFrame(animCards);
}

document.addEventListener(
    "scroll",
    (e) => {
        head.style.height = (maxTBH-smoothStep(
            constrain(window.scrollY/H*100/sLen,0,1)
        )*(sLen))+"vh";
    }
);