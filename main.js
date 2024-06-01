let x = [];
let y = [];
let a = 1;
let t = 0;

//// parabola discretization
const numPoints = 40;
//// frame rate time step
const dt = 0.025;
//// focus y position
let fy = 0;
//// parabola width
let D = 1;
//// parabola height
let h = 1;
//// positioning button
let positioningButton;
//// flag mouse mic positioning
let flagMouseMicPosition = false;
//// parabola relative canvas size
let parabolaRelativeWeight = 0.5;
//// parabola canvas size
const canvasSize = 400;
//// microphone size
let micSize = 0.025;
//// frequency array
let frequency = [];
//// mic gain/attenuation
let micdBAmplitude = [];
//// frequency step
let df = 10;
//// frequency step
let maxFrequency = 10000;
//// frequency step
let minFrequency = 20;
//// plot chart
let responseChart;
//// speed of Sound
let speedOfSound = 340;
//// parabola size & position
let parabolaGraph = {
  width: 225, 
  height: 225,
  position: {
    x: 50,
    y: 350
  }
};
//// flag Air temperature
let  flagAirTemperature = 0;

let Fp = [];
let tempData = [];
let micPositionSlider, micPositionInput;
let parabolaWidthSlider, parabolaWidthInput;
let parabolaHeightSlider, parabolaHeightInput;
let temperatureSlider, temperatureInput;
let micDiameterInput;
let mainFont = 'Consolas';

let airTemperature =  20;
const R = 8.314463; // J / (mol K)
const Mair = 0.0289645; // (kg / mol)
const gamma = 1.4;


function setup() {
  createCanvas(windowWidth, windowHeight);
  frameRate(12);
  // pixelDensity(1);

  textFont(mainFont);
  Chart.defaults.global.defaultFontFamily = mainFont;
  Chart.defaults.global.tooltips.enabled = false;
  Chart.defaults.global.defaultFontColor = 'black';
  Chart.defaults.global.title.fontColor = 'black';

  createGUIElements();

  frequency = Array(Math.ceil((maxFrequency - minFrequency) / df)).fill(minFrequency).map((x, y) => x + y * df)
  micdBAmplitude = Array(frequency.length);

  for(let i = 0 ; i < frequency.length ; i++){
    tempData.push({x: frequency[i], y: 0});
    Fp.push(0);
  }
  createMicChart();
  updateMicChart(0.25*D,D);
  createReferenceLinks();
  
}

function exportCSVTable(){
  let table = new p5.Table();
  table.addColumn('Frequency [Hz]');
  table.addColumn('SPL Gain [dB]');


  for(let idx = 0; idx < frequency.length; idx++){
    let newRow = table.addRow();
    newRow.setNum('Frequency [Hz]',frequency[idx]);
    newRow.setNum('SPL Gain [dB]',micdBAmplitude[idx]);
  }

  saveTable(table, 'SPL_gain_parabolic_reflector.csv');
}

function draw() {
  background(255);
  
  if(flagAirTemperature){
    airTemperature = temperatureSlider.value();
  }
  
  D = parabolaWidthSlider.value();
  h = parabolaHeightSlider.value();
  
  resetRatio();
  drawParabola();
  drawGUILabels();

  computeSpeedOfSound();

  updateMicChart(fy,h);
  
  if(flagAirTemperature){
    temperatureInput.elt.value = airTemperature.toFixed(3);
  }
  parabolaWidthInput.elt.value = D.toFixed(3);
  parabolaHeightInput.elt.value = h.toFixed(3);
  
  fill(255);
  rect(0,0,windowWidth*0.5,windowHeight*0.5);
}

function drawParabola() {
  let measurePosition = {
      x: parabolaGraph.position.x,
      y: parabolaGraph.position.y + parabolaGraph.height,
    };

  fill(150);
  stroke(200);
  strokeWeight(2);
  
  //// draw vertical line
  line(parabolaGraph.position.x + parabolaGraph.width/2,
       parabolaGraph.position.y,
       parabolaGraph.position.x + parabolaGraph.width/2,
       parabolaGraph.position.y + parabolaGraph.height);

  a = h/((D/2)**2);
  fy = 1/(4*a);
  x = [];
  y = [];
  for(let i = 0 ; i <= numPoints ; i++){
    x.push( (i/(numPoints) - 0.5) * D );
    y.push(a*x[i]**2);
  }

  drawMeasure("horizontal",measurePosition,parabolaGraph.width,"D");

  measurePosition = {
    x: parabolaGraph.position.x - 10,
    y: parabolaGraph.position.y + parabolaGraph.height*(1 - y[0]/D)
  };

  drawMeasure("vertical",measurePosition,parabolaGraph.height*y[0]/D,"h");

  //// compute focus 
  let micPosition = createVector((parabolaGraph.position.x + parabolaGraph.width/2),
        parabolaGraph.position.y + (1 - fy/D)*( parabolaGraph.height)*0.95);

  measurePosition = {
    x: parabolaGraph.position.x + parabolaGraph.width + 10,
    y: parabolaGraph.position.y + parabolaGraph.height*(1 - fy/D)
  };

  stroke(200);
  strokeWeight(1);
  line(parabolaGraph.position.x + parabolaGraph.width/2,
    parabolaGraph.position.y + parabolaGraph.height*(1 - fy/D),
      parabolaGraph.position.x + parabolaGraph.width,
      parabolaGraph.position.y + parabolaGraph.height*(1 - fy/D));
  
  drawMeasure("vertical",measurePosition,parabolaGraph.height*fy/D,"a");
    fill(150);
    stroke(200);
    strokeWeight(2);
    line(parabolaGraph.position.x,
      parabolaGraph.position.y + (1 - y[0]/D)*0.95*(parabolaGraph.height),
      parabolaGraph.position.x + parabolaGraph.width,
      parabolaGraph.position.y + (1 - y[0]/D)*0.95*(parabolaGraph.height)
      );
    for(let i = 1 ; i <= numPoints ; i++){
        stroke(0);
        strokeWeight(4);
        line(parabolaGraph.position.x + (x[i-1]/D + 0.5)*parabolaGraph.width,
            parabolaGraph.position.y + (1 - y[i-1]/D)*0.95*parabolaGraph.height,
            parabolaGraph.position.x + (x[i]/D + 0.5)*parabolaGraph.width,
            parabolaGraph.position.y + (1 - y[i]/D)*0.95*parabolaGraph.height )
        stroke(0,100,240);
        strokeWeight(0.5);
        line( parabolaGraph.position.x + (x[i-1]/D + 0.5)*parabolaGraph.width,
            parabolaGraph.position.y + (1 - y[i-1]/D)*0.95*parabolaGraph.height,
            micPosition.x,
            micPosition.y) 
               
    }
      line( parabolaGraph.position.x + (x[x.length-1]/D + 0.5)*parabolaGraph.width,
            parabolaGraph.position.y + (1 - y[y.length-1]/D)*0.95*parabolaGraph.height,
              micPosition.x,
              micPosition.y) 
      stroke(0);
      fill(0);
      strokeWeight(0);
      micSize = 10;
      ellipse(micPosition.x,micPosition.y,micSize,micSize);
}

function drawMeasure(type,position,size,label){
  let trianguleSize = 5;
  let deltaText = 15;
  textSize(12);
  switch(type){
    case "horizontal":
      fill(150);
      stroke(230);
      strokeWeight(1);
      line(position.x,
          position.y,
          position.x + size,
          position.y
      );
      noStroke();
      triangle(position.x, position.y,
                position.x + trianguleSize, position.y - trianguleSize,
                position.x + trianguleSize, position.y + trianguleSize
                );
      triangle(position.x + size, position.y,
                position.x + size - trianguleSize, position.y - trianguleSize,
                position.x + size - trianguleSize, position.y + trianguleSize
                );
      fill(0);
      textAlign(CENTER);
      text(label, position.x + size/2, position.y + deltaText);
      break;
    case "vertical":
      fill(150);
      stroke(230);
      strokeWeight(1);
      line(position.x,
        position.y,
        position.x,
        position.y + size
      );
      noStroke();
      triangle(position.x, position.y,
                position.x - trianguleSize, position.y + trianguleSize,
                position.x + trianguleSize, position.y + trianguleSize
                );
      triangle(position.x, position.y + size,
                position.x - trianguleSize, position.y + size - trianguleSize,
                position.x + trianguleSize, position.y + size - trianguleSize
                );
      fill(0);
      textAlign(CENTER);
      text(label, position.x + deltaText , position.y + size/2);
      break;
  }
}

function createGUIElements(){

  let sliderWidth = 100;
  let sliderPosition = {
    x: parabolaGraph.position.x + parabolaGraph.width + 200, 
    y: 475
  };
  let dx = 70;
  let dy = 30;
  let inputSize = 40;

  parabolaWidthSlider = createSlider(0.01,2,0.5,0.001);
  parabolaWidthSlider.position(sliderPosition.x + dx , sliderPosition.y + 0.25*dy);
  parabolaWidthSlider.class("slider");
  parabolaWidthSlider.style('width',sliderWidth.toString()+'px');
  
  parabolaWidthInput = createInput(' ');
  parabolaWidthInput.position(sliderPosition.x, sliderPosition.y);
  parabolaWidthInput.size(inputSize);
  parabolaWidthInput.input(setParabolaWidth);

  parabolaHeightSlider = createSlider(0.01,2.0,0.25,0.001);
  parabolaHeightSlider.position(sliderPosition.x + dx , sliderPosition.y + 1.25*dy);
  parabolaHeightSlider.class("slider");
  parabolaHeightSlider.style('width',sliderWidth.toString()+'px');
  
  parabolaHeightInput = createInput(' ');
  parabolaHeightInput.position(sliderPosition.x, sliderPosition.y + dy);
  parabolaHeightInput.size(inputSize);
  parabolaHeightInput.input(setParabolaHeight);

  if(flagAirTemperature){
    temperatureSlider = createSlider(-10.0,50.0,20.0,0.5);
    temperatureSlider.position(sliderPosition.x + dx , sliderPosition.y + 2.25*dy);
    temperatureSlider.class("slider");
    temperatureSlider.style('width',sliderWidth.toString()+'px');
    
    temperatureInput = createInput('');
    temperatureInput.position(sliderPosition.x, sliderPosition.y + 2*dy);
    temperatureInput.size(inputSize);
    temperatureInput.input(setTemperature);
  }

  exportButton = createButton('EXPORT RESULTS');
  exportButton.style('font-family','Consolas');
  exportButton.style('background-color', color(0,100,240,255));
  exportButton.style('color', color(255));
  exportButton.position(sliderPosition.x + sliderWidth*0.5, sliderPosition.y + 4*dy);
  exportButton.mousePressed(exportCSVTable);
}

function drawGUILabels(){
  textAlign(LEFT);
  let labelPosition = {
    x: parabolaGraph.position.x + parabolaGraph.width + 100,
    y: 450
  };
  let dx = 145;
  let dy = 30;
  textSize(12);
  stroke(0);
  text('diameter (D):', labelPosition.x, labelPosition.y + dy);
  text('m', labelPosition.x + dx, labelPosition.y + dy);
  text('height (h):',labelPosition.x, labelPosition.y + 2*dy);
  text('m', labelPosition.x + dx, labelPosition.y + 2*dy);
  if(flagAirTemperature){
    text('temperature:', labelPosition.x, labelPosition.y + 3*dy);
    text('°C', labelPosition.x + dx, labelPosition.y + 3*dy);
  }
  text('microphone focus position (a): '+ (fy).toFixed(3) + 'm', labelPosition.x, labelPosition.y + 4*dy);

  dx = 80;
  let ddy = 70;
  textAlign(RIGHT);
  textSize(10);
  text('Developed by',labelPosition.x + dx,labelPosition.y + 6.25*dy + ddy);
  dx = 150;
  text('Based on the analytical model described by',labelPosition.x + dx,labelPosition.y + 6.75*dy + ddy);
  
}

function createReferenceLinks(){
  let linkHome, linkRef;
  let labelPosition = {
    x: parabolaGraph.position.x + parabolaGraph.width + 45,
    y: 425
  };
  let dx = 150;
  let dy = 30;
  let ddy = 70;
  
  linkHome = createA('http://kauewerner.github.io/','Kauê Werner','_blank');
  linkHome.position(labelPosition.x + 1*dx,labelPosition.y + 7*dy + ddy);
  linkHome.style('font-family', mainFont);
  linkHome.style('font-size', '10px');
  
  linkRef = createA('http://www.aes.org/e-lib/browse.cfm?elib=4443','Sten Wahlström','_blank');
  linkRef.position(labelPosition.x + 1.45*dx,labelPosition.y + 7*dy + 15 + ddy);
  linkRef.style('font-family', mainFont);
  linkRef.style('font-size', '10px');
}

function createMicChart(){
  let ctx = document.getElementById('chartCanvas').getContext('2d');
  responseChart = new Chart(ctx, {
    type: 'scatter',
    data: {
        datasets: [{
            data: tempData,
            showLine: true,
            borderWidth: 1,
            backgroundColor: 'rgba(0,0,0,0)',
            borderColor: 'rgba(0,100,240,1)',
            pointRadius: 0,
        }]
    },
    options: {
      scales: {
          xAxes: [{
              type: 'logarithmic',
              ticks: {
                  callback: function(tick) {
                      var remain = tick / (Math.pow(10, Math.floor(Chart.helpers.log10(tick))));
                      if (remain === 1 || remain === 5) {
                          return tick.toString();
                      }
                      return '';
                  
                    },
                  min: minFrequency,
                  max: maxFrequency
              },
              scaleLabel: {
                labelString: 'Frequency [Hz]',
                display: true,
              }
          }],
          yAxes: [{
              ticks: {
                  min: -30,
                  max: 50
              },
              scaleLabel: {
                labelString: 'SPL Gain [dB]',
                display: true,
              }
          }],
          
      },
      legend: {
          display: false
      },
      aspectRatio: 1,
      maintainAspectRatio: false,
      title: {
        display: true,
        text: 'ACOUSTIC PARABOLIC REFLECTOR GAIN'
      }
  }
  }
  );
}

function setParabolaHeight(){
  h = parseFloat(this.value());
  parabolaHeightSlider.value(h);
}

function setParabolaWidth(){
  D = parseFloat(this.value());
  parabolaWidthSlider.value(D);
}

function setTemperature(){
  airTemperature = parseFloat(this.value());
  if(flagAirTemperature){
    temperatureSlider.value(airTemperature);
  }
}

function updateMicChart(ha,l){
  for(let i = 0 ; i<frequency.length; i++){
    Fp[i] = (
            1 + (4*Math.PI*frequency[i]*(ha/speedOfSound)*Math.log(1+ l/ha))**2 
            + 8*Math.PI*frequency[i]*(ha/speedOfSound)*Math.log(1+ l/ha)*Math.sin(4*Math.PI*frequency[i]*(ha/speedOfSound))
            )**0.5;
    micdBAmplitude[i] = 20*Math.log10(Fp[i])
    tempData[i].y =  micdBAmplitude[i];
  }
  
  responseChart.data.datasets.data = tempData;
  responseChart.update();
}

function resetRatio(){
  if( h/D > 1){
    h = D;
    parabolaHeightSlider.elt.value = h;
    parabolaHeightInput.elt.value = h.toFixed(2);
  } else if (h/D < 0.075) {
    h = 0.075*D;
    parabolaHeightSlider.elt.value = h;
    parabolaHeightInput.elt.value = h.toFixed(2);
  }
}

function computeSpeedOfSound(){
  speedOfSound = Math.sqrt(gamma*(R/Mair)*(airTemperature + 273.17));
}