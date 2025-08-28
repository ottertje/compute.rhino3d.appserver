import * as THREE from 'three'
import { Rhino3dmLoader } from 'three/examples/jsm/loaders/3DMLoader'
import rhino3dm from 'rhino3dm'

const loader = new Rhino3dmLoader()
loader.setLibraryPath('https://unpkg.com/rhino3dm@8.0.0-beta3/')

// setup input change events
const depth_slider = document.getElementById('depth')
const width_slider = document.getElementById('width')
const height_slider = document.getElementById('height')

const apply = document.getElementById('apply-apply')
apply.addEventListener('click', applyScale, false)

const fly_building = document.getElementById('fly-to-BK-building')
fly_building.addEventListener('click', flyToBK, false)
const remove_layer = document.getElementById('remove-layer')
remove_layer.addEventListener('click', RemoveAllAddBuildings, false)

const add_1 = document.getElementById('add-one')
add_1.addEventListener('click', () => { addtypeone(1); }, false)
const add_2 = document.getElementById('add-two')
add_2.addEventListener('click', () => { addtypeone(2); }, false)
const add_3 = document.getElementById('add-three')
add_3.addEventListener('click', () => { addtypeone(3); }, false)

const room_preview = document.getElementById('room-preview')
room_preview.addEventListener('click', roomPreview, false)

const delet_select = document.getElementById('select-delete')
delet_select.addEventListener('click', deleteSelect, false)

const simulation_1 = document.getElementById('option-1')
simulation_1.addEventListener('click', () => { showPicture('./DA.jpg'); }, false)
simulation_1.addEventListener('click', () => { onButtonPress(1); }, false)

const simulation_2 = document.getElementById('option-2')
simulation_2.addEventListener('click', () => { showPicture('./sDA.jpg'); }, false)
simulation_2.addEventListener('click', () => { onButtonPress(2); }, false)

const simulation_3 = document.getElementById('option-3')
simulation_3.addEventListener('click', () => { showPicture('./UDI.jpg'); }, false)
simulation_3.addEventListener('click', () => { onButtonPress(3); }, false)

const simulation_4 = document.getElementById('option-4')
simulation_4.addEventListener('click', () => { showPicture('./SBI.jpg'); }, false)
simulation_4.addEventListener('click', () => { onButtonPress(4); }, false)


const material_1 = document.getElementById('material-1');
material_1.addEventListener('click', () => { applyMaterial(1) }, false);

const material_2 = document.getElementById('material-2');
material_2.addEventListener('click', () => { applyMaterial(2) }, false);

const material_3 = document.getElementById('material-3');
material_3.addEventListener('click', () => { applyMaterial(3) }, false);


document.addEventListener("DOMContentLoaded", function () {
  const radioButtons = document.querySelectorAll('input[name="eyeLevel"]');
  radioButtons.forEach(function (radioButton) {
    radioButton.addEventListener("change", function () {
      getSelectedEyeLevel(this);
    });
  });
});

function getSelectedEyeLevel(selectedRadioButton) {
  eyeHeight = selectedRadioButton.value;
  console.log(eyeHeight)
}

document.addEventListener("DOMContentLoaded", function () {
  const radioButtons = document.querySelectorAll('input[name="LODLevel"]');
  radioButtons.forEach(function (radioButton) {
      radioButton.addEventListener("change", function () {
          getSelectedLODLevel(this);
      });
  });
});

function getSelectedLODLevel(selectedRadioButton) {
  LOD = parseInt(selectedRadioButton.value, 10);
  console.log(`LOD is now set to: ${LOD}`);
}


// Fetch the JSON file
fetch('floorDATA.json')
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(jsondata => {
    console.log(jsondata); // Use the jsonData object as needed
    parsedObject = jsondata
  })
  .catch(error => {
    console.error('There was a problem fetching the JSON file:', error);
  });


function showPicture(picture) {
  var pictureContainer = document.getElementById('pictureContainer');
  var image = new Image();
  image.src = picture;
  pictureContainer.innerHTML = '';
  pictureContainer.appendChild(image);
  image.style.display = 'block';
}


function materialIDtoRGB(i) {
  switch (i) {
    case 1:  //red
      return { r: 0.909, g: 0.768, b: 0.662 }
    case 2: //blue
      return { r: 0.796, g: 0.941, b: 0.949 }
    case 3: //yellow
      return { r: 0.909, g: 0.886, b: 0.662 }
  }
}


function applyMaterial(i) {
  // addbuildingMaterialList.splice([select_index - 19], 1, i) //remove old and add new
  addbuildingMaterialList.splice([select_index - 476], 1, i) //remove old and add new
  //因为所有建筑都有默认材质了
  if (if_selected) {
    showMaterial()
    console.log(`hihi`)
    console.log(selectOS)
    for (let j = 0; j < selectOS.children[0].children[0].children[0].children[0].children.length; j++) {
      selectOS.children[0].children[0].children[0].children[0].children[j].material.color = materialIDtoRGB(i)
      tb.update()
      map.repaint = true  //re-render
    }
  }
}


function hideshowMaterial() {
  messageMaterial = ""
  document.getElementById("material-result").innerHTML = messageMaterial;
}


//general seetings
let EPWURL = "https://climate.onebuilding.org/WMO_Region_6_Europe/NLD_Netherlands/ZH_Zuid-Holland/NLD_ZH_Ypenburg.062000_TMYx.zip" // default weather URL of Delft


//added building
let building_list = [] //[1, 2, 2, 3]  building type list
let addbuildingScaleList = [] //[[x,y,z],[x,y,z],...]
let addbuildingMaterialList = [] //[1, 2, 1]  default = 1
let messageMaterial // ui
//current selection of added building
let select_uuid
let select_index
let if_selected  //boolean checkIfAnyAddBuildingSelected 
let selectedBuildingCoordinate
let selectBuildingType
let selectBuildingMaterial
let x_scalefactor, y_scalefactor, z_scalefactor
let selectOS //e.detail of added buildings

//BK building
let ElemntDic = {} //{0: Os, 1: Os, 3: Os...}   {objectindex: {roomObject}}
let roomNumberArray = []  //create room number set  {'0', '1', '3', '4', '5', …}
let roomNameArray = []    //     ['01.Mid.010', '01.Mid.100',…]
let roomNumName = {} //    {1: '01.Mid.010', 3: '01.Mid.100',…} => {01.Mid.010: 1, 01.Mid.100: 3,…} changed
let roomNumLevel = {} //   {1: '1st floor', 3: '1st floor',…}
let parsedObject // the object of {0: [4.369961351472325, 52.005474005506976], 1: [4.37071773004964, 52.00583180105626], 3: [4.370371733227462, 52.00555044297889], ...}
//current selection of BK building
let selectRoomNum
let selectRoomLevel
let selectwholeobject  //get the object of the whole room Os:{....}
let m  //copy of select_uuid
let eyeHeight = 0.8 // 0.8 or 1.2
let LOD = 2 // 1 or 2 (1 for 1.3, 2 for 2.2)

//Rhino compute
let rhinoModel
let messageSimulation
let messageComparison
let simulation_data = 0.5
let metrics

//comparison
let roomSimuResult = {}  // 1: [DA(0.8), sDA(0.8), UDI(0.8), DA(1.2), sDA(1.2), UDI(1.2), ]


document.addEventListener("DOMContentLoaded", function () {
  const popupButton = document.getElementById("EPW-map");
  const popup = document.getElementById("popup");
  const closePopup = document.getElementById("closePopup");

  popupButton.addEventListener("click", function () {
    popup.style.display = "block";
  });

  closePopup.addEventListener("click", function () {
    popup.style.display = "none";
  });

  okButton.addEventListener("click", function () {
    EPWURL = document.getElementById("userInput").value;
    // console.log("User input:", userInput);
    popup.style.display = "none";
  });

  window.addEventListener("click", function (event) {
    if (event.target == popup) {
      popup.style.display = "none";
    }
  });
});


document.addEventListener("DOMContentLoaded", function () {
  // Fetch and parse CSV file
  fetch('./RoomInformation.csv')
    .then(response => response.text())
    .then(data => {
      const lines = data.split('\n');
      // Extract unique values from CSV
      roomNumberArray.push(0) // Add zero for the roof and other parts of the building
      lines.forEach(line => {
        let value = line.trim();
        value = value.split(",")
        if (value[0]) {
          roomNumberArray.push(parseInt(value[0]));
          roomNameArray.push(value[1]);
          roomNumName[value[1]] = parseInt(value[0]);
          roomNumLevel[value[0]] = value[2];
        }
      });
      console.log(roomNumberArray)
      console.log(roomNameArray)
      console.log(roomNumName)

      // Populate dropdown with unique values
      let options = ""
      roomNameArray.forEach(value => {
        options += '<option value=" ' + value + '">'
      });
      document.getElementById('roomNumbersList').innerHTML = options;
    })
    .catch(error => console.error('Error fetching CSV:', error));
});


function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value);
}


function flyToBK() {
  map.flyTo({
    center: [4.370614, 52.005612],
    zoom: 17.5,
    pitch: 60,
    bearing: 110
  })
};


var computePress = false


// Shows or hides the loading spinner
function showSpinner(enable) {
  if (enable)
    document.getElementById('loader').style.display = 'block'
  else
    document.getElementById('loader').style.display = 'none'
}

function onButtonPress(i) {
  if (computePress) {
    tb.clear(['rhinoComputeObject_layer', true])
    tb.removeLayer('rhinoComputeObject_layer')
    tb.remove(rhinoModel)
  }
  compute(i)
  metrics = i
  // show spinner
  showSpinner(true)
};


// load the rhino3dm library
let doc
console.log('Calling rhino3dm.')
const rhino = await rhino3dm()
console.log('Loaded rhino3dm.')


// Call appserver
async function compute(i) {
  computePress = true
  if (!selectRoomNum) {
    alert(`Please select a room first!`)
  } else {
    let t0 = performance.now()
    const timeComputeStart = t0
    const latitude_m = 40075000 / 360
    const longtiude_m = (40075000 * Math.cos(52.007102014389176 * (Math.PI / 180))) / 360
    let rotation_all = []
    let lati = [] //y
    let longt = [] //x

    let rotation_type1 = []
    let rotation_type2 = []
    let rotation_type3 = []
    let lati_type1 = []
    let lati_type2 = []
    let lati_type3 = []
    let longt_type1 = []
    let longt_type2 = []
    let longt_type3 = []
    let scale_type1_x = []
    let scale_type1_y = []
    let scale_type1_z = []
    let scale_type2_x = []
    let scale_type2_y = []
    let scale_type2_z = []
    let scale_type3_x = []
    let scale_type3_y = []
    let scale_type3_z = []
    let material_type1 = []
    let material_type2 = []
    let material_type3 = []

    tb.world.children.forEach((o) => { rotation_all.push(((o.rotation.z) * (180 / Math.PI))) })
    tb.world.children.forEach((o) => { longt.push(((o.coordinates[0]) - 4.371029663172603) * longtiude_m) })
    tb.world.children.forEach((o) => { lati.push(((o.coordinates[1]) - 52.007102014389176) * latitude_m) })    //4.371029663172603, 52.007102014389176 field_location
    rotation_all.splice(0, 477)  //remove the BK building (first 20 of the list)  478   default: 50.5
    lati.splice(0, 477)  //remove the BK building(first item of the list)   default: [-152.7318795728563]
    longt.splice(0, 477)  //remove the BK building(first item of the list)  default: [-9.570309903138407]


    for (let j = 0; j < building_list.length; j++) {
      switch (building_list[j]) {
        case 1:
          rotation_type1.push(rotation_all[j])
          lati_type1.push(lati[j])
          longt_type1.push(longt[j])
          // scale_type1.push(addbuildingScaleList[j])
          scale_type1_x.push(addbuildingScaleList[j][0])
          scale_type1_y.push(addbuildingScaleList[j][1])
          scale_type1_z.push(addbuildingScaleList[j][2])
          material_type1.push(addbuildingMaterialList[j])
          break;
        case 2:
          rotation_type2.push(rotation_all[j])
          lati_type2.push(lati[j])
          longt_type2.push(longt[j])
          // scale_type2.push(addbuildingScaleList[j])
          scale_type2_x.push(addbuildingScaleList[j][0])
          scale_type2_y.push(addbuildingScaleList[j][1])
          scale_type2_z.push(addbuildingScaleList[j][2])
          material_type2.push(addbuildingMaterialList[j])
          break;
        case 3:
          rotation_type3.push(rotation_all[j])
          lati_type3.push(lati[j])
          longt_type3.push(longt[j])
          // scale_type3.push(addbuildingScaleList[j])
          scale_type3_x.push(addbuildingScaleList[j][0])
          scale_type3_y.push(addbuildingScaleList[j][1])
          scale_type3_z.push(addbuildingScaleList[j][2])
          material_type3.push(addbuildingMaterialList[j])
      }
    }

    let data = {}
    data.definition = `selectRoom_${i}_${LOD}.gh`

    if (i != 4) {
    data.inputs = {
      'SelectedRoom': Number(selectRoomNum),  //number
      'eyeLevel': eyeHeight,  //string
      'epwURL': EPWURL, //by deafult set to delft
      'Rotationtype1': rotation_type1,
      'Rotationtype2': rotation_type2,
      'Rotationtype3': rotation_type3,
      'Latitudetype1': lati_type1,
      'Latitudetype2': lati_type2,
      'Latitudetype3': lati_type3,
      'Longtitudetype1': longt_type1,
      'Longtitudetype2': longt_type2,
      'Longtitudetype3': longt_type3,
      'Scaletype1x': scale_type1_x,
      'Scaletype1y': scale_type1_y,
      'Scaletype1z': scale_type1_z,
      'Scaletype2x': scale_type2_x,
      'Scaletype2y': scale_type2_y,
      'Scaletype2z': scale_type2_z,
      'Scaletype3x': scale_type3_x,
      'Scaletype3y': scale_type3_y,
      'Scaletype3z': scale_type3_z,
      'Materialtype1': material_type1,
      'Materialtype2': material_type2,
      'Materialtype3': material_type3
      }
    } else {
      data.inputs = {
        'SelectedRoom': Number(selectRoomNum),  //number
        'Rotationtype1': rotation_type1,
        'Rotationtype2': rotation_type2,
        'Rotationtype3': rotation_type3,
        'Latitudetype1': lati_type1,
        'Latitudetype2': lati_type2,
        'Latitudetype3': lati_type3,
        'Longtitudetype1': longt_type1,
        'Longtitudetype2': longt_type2,
        'Longtitudetype3': longt_type3,
        'Scaletype1x': scale_type1_x,
        'Scaletype1y': scale_type1_y,
        'Scaletype1z': scale_type1_z,
        'Scaletype2x': scale_type2_x,
        'Scaletype2y': scale_type2_y,
        'Scaletype2z': scale_type2_z,
        'Scaletype3x': scale_type3_x,
        'Scaletype3y': scale_type3_y,
        'Scaletype3z': scale_type3_z,
        }
    }

    console.log(data.inputs)
    console.log(LOD)
    console.log(`selectRoom_${i}_${LOD}.gh`)


    const request = {
      'method': 'POST',
      'body': JSON.stringify(data),
      'headers': { 'Content-Type': 'application/json' }
    }

    let headers = null

    try {
      const response = await fetch('/solve', request)
      if (!response.ok)
        throw new Error(response.statusText)
      headers = response.headers.get('server-timing')
      const responseJson = await response.json()
      collectResults(responseJson)
      // Request finished. Do processing here.
      let t1 = performance.now()
      const computeSolveTime = t1 - timeComputeStart
      t0 = t1
      t1 = performance.now()
      const decodeMeshTime = t1 - t0
      t0 = t1
      t1 = performance.now()
      const rebuildSceneTime = t1 - t0
      console.log(`  ${Math.round(computeSolveTime)} ms: appserver request`)
      console.log(responseJson.values)

      let difference
      switch (i) {
        case 1:
          simulation_data = responseJson.values[1].InnerTree['{0;0}'].map(d => d.data) //["", "", ""]
          simulation_data[0] = parseFloat(simulation_data[0].replace(/"/g, '')).toFixed(2)
          simulation_data[1] = parseFloat(simulation_data[1].replace(/"/g, '')).toFixed(2)
          difference = simulation_data[0] - roomSimuResult[selectRoomNum][eyeHeight == 0.8 ? 0 : 3]// new - old
          if (difference <= 1) {
            if (difference != 0) {
              messageComparison = "DA value of the room <span class='compare-result " + (difference < 0 ? "decreased" : "increased") + "'>" + (difference < 0 ? "decreased" : "increased") + "</span> by <span class='result'>" + (Math.abs(difference) * 100).toFixed(3) + "%</span> due to the change you made last time.";
            } else {
              messageComparison = "DA value of the room remains the same due to your last change."
            }
          } else {
            messageComparison = "This is the first time you run DA simulation on this room with the surface level height and LOD value you chose."
          }
          roomSimuResult[selectRoomNum][eyeHeight == 0.8 ? 0 : 3] = simulation_data[0]
          messageSimulation = "On average, the selected room receives at least 300 lux daylight for <span class='result'>" + simulation_data[0] + "%</span> of the occupied hours throughout the year. with a standard deviation of <span class='result'>" + simulation_data[1] + "%</span> (DA)";
          break;

        case 2:
          simulation_data = responseJson.values[1].InnerTree['{0;0;0}'].map(d => d.data) 
          simulation_data[0] = parseFloat(simulation_data[0].replace(/"/g, '')).toFixed(2)
          difference = simulation_data[0] - roomSimuResult[selectRoomNum][eyeHeight == 0.8 ? 1 : 4] // new - old
          console.log(difference)
          console.log(simulation_data[0])
          if (difference <= 1) {
            if (difference != 0) {
              messageComparison = "sDA value of the room <span class='compare-result " + (difference < 0 ? "decreased" : "increased") + "'>" + (difference < 0 ? "decreased" : "increased") + "</span> by <span class='result'>" + (Math.abs(difference) * 100).toFixed(3) + "%</span> due to the change you made last time.";
            } else {
              messageComparison = "sDA value of the room remains the same due to your last change."
            }
          } else {
            messageComparison = "This is the first time you run sDA simulation on this room with the surface level height and LOD value you chose."
          }
          roomSimuResult[selectRoomNum][eyeHeight == 0.8 ? 1 : 4] = simulation_data[0]
          messageSimulation = "<span class='result'>" + simulation_data[0] * 100 + "%</span> of the area of the selected room receives at least 300 lux of natural daylight for at least 50% of the occupied hours throughout the year. (sDA)";
          break;
          
        case 3:
          simulation_data = responseJson.values[1].InnerTree['{0;0}'].map(d => d.data) //["", "", "",""]
          simulation_data[0] = parseFloat(simulation_data[0].replace(/"/g, '')).toFixed(2)
          simulation_data[1] = parseFloat(simulation_data[1].replace(/"/g, '')).toFixed(2)
          simulation_data[2] = parseFloat(simulation_data[2].replace(/"/g, '')).toFixed(2)
          simulation_data[3] = parseFloat(simulation_data[3].replace(/"/g, '')).toFixed(2)
          difference = simulation_data[0] - roomSimuResult[selectRoomNum][eyeHeight == 0.8 ? 2 : 5] // new - old
          if (difference <= 1) {
            if (difference != 0) {
              messageComparison = "UDI value of the room <span class='compare-result " + (difference < 0 ? "decreased" : "increased") + "'>" + (difference < 0 ? "decreased" : "increased") + "</span> by <span class='result'>" + Math.abs(difference).toFixed(3) + "%</span> due to the change you made last time.";
            } else {
              messageComparison = "UDI value of the room remains the same due to your last change."
            }
          } else {
            messageComparison = "This is the first time you run UDI simulation on this room with the surface level height and LOD value you chose."
          }
          roomSimuResult[selectRoomNum][eyeHeight == 0.8 ? 2 : 5] = simulation_data[0]
          messageSimulation = "On average, <span class='result'>" + simulation_data[0] + "%</span> of the time during occupied hours throughout the year, the illuminance levels within the room are between 100-3000lux. With a standard deviation of <span class='result'>" + simulation_data[1] + "%</span>.  Annually <span class='result'>" + simulation_data[2] + "%</span>" + "of the time it is too dark, and <span class='result'>" + simulation_data[3] + "%</span> of the time it might cause glare. (UDI)";
          break;
          
        case 4:
          simulation_data = responseJson.values[1].InnerTree['{0;0}'].map(d => d.data) //["", "", "",""]
          simulation_data[0] = parseFloat(simulation_data[0].replace(/"/g, '')).toFixed(2)
          simulation_data[1] = parseFloat(simulation_data[1].replace(/"/g, '')).toFixed(2)
          messageSimulation = "The mean SBI value of the room is <span class='result'>" + simulation_data[0] + "</span> (m2hours)" + " with a mean efficiency of <span class='result'>" + simulation_data[1] + "</span> (hours)";
          console.log(simulation_data)
      }
      console.log(simulation_data)
      console.log(simulation_data[0])
      console.log(simulation_data)  
      console.log(eyeHeight)
      document.getElementById("resultMessage").innerHTML = messageSimulation; // Display the message on the webpage
      document.getElementById("compareMessage").innerHTML = messageComparison;
    } catch (error) {
      console.error(error)
    }

  }

  function collectResults(responseJson) {
    getSimulationLocation()
    const values = responseJson.values

    // clear doc
    if (doc !== undefined)
      doc.delete()

    //console.log(values)
    doc = new rhino.File3dm()

    // for each output (RH_OUT:*)...
    for (let i = 0; i < values.length; i++) {
      // ...iterate through data tree structure...
      for (const path in values[i].InnerTree) {
        const branch = values[i].InnerTree[path]
        // ...and for each branch...
        for (let j = 0; j < branch.length; j++) {
          // ...load rhino geometry into doc
          const rhinoObject = decodeItem(branch[j])
          if (rhinoObject !== null) {
            doc.objects().add(rhinoObject, null)
          }
        }
      }
    }

    if (doc.objects().count < 1) {
      console.error('No rhino objects to load!')
      showSpinner(false)
      return
    }

    // load rhino doc into three.js scene
    const buffer = new Uint8Array(doc.toByteArray()).buffer
    loader.parse(buffer, function (object) {
      object.traverse(child => {
        console.log(child)
        if (child.material)
          child.material = new THREE.MeshBasicMaterial({ vertexColors: true })
      }, false)

      map.addLayer({
        id: 'rhinoComputeObject_layer',
        type: 'custom',
        renderingMode: '3d',
        onAdd: function (map, mbxContext) {
          //instantiate a red sphere and position it at the origin lnglat
          var options = {
            obj: object,
            units: 'meters',
            rotation: { x: 0, y: 0, z: 180 }, 
            anchor: 'center',
          }
          rhinoModel = tb.Object3D(options);
          rhinoModel.selectable = false;
          rhinoModel.draggable = false;
          rhinoModel.rotatable = false;
          rhinoModel.altitudeChangeable = false;
          rhinoModel.setCoords(simulation_location);
          tb.add(rhinoModel);
        },

        render: function (gl, matrix) {
          tb.update();
        }
      })
      // hide spinner and enable download button
      showSpinner(false)
    }, (error) => {
      console.error(error)
    })
  }
}

function decodeItem(item) {
  const data = JSON.parse(item.data)
  if (item.type === 'System.String') {
    // hack for draco meshes
    try {
      return rhino.DracoCompression.decompressBase64String(data)
    } catch { } // ignore errors (maybe the string was just a string...)
  } else if (typeof data === 'object') {
    return rhino.CommonObject.decode(data)
  }
  return null
}


//Mapbox
// Please enter the mapbox token, you can retrive your token from: https://console.mapbox.com/account/access-tokens/:
mapboxgl.accessToken = 'Fill in own mapbox token';
const model_location = [4.370890, 52.005730, -1.7]
let simulation_location = [4.370045072533668, 52.00486177059497, 1.87582]     //4.370045072533668, 52.00486177059497
const field_location = [4.371029663172603, 52.007102014389176]
const initial_zoom = 15.5
const initial_pitch = 45
const initial_bearing = -17.6


var map = new mapboxgl.Map({
  container: 'mapID',
  style: 'mapbox://styles/mapbox/light-v11',
  center: [4.370765, 52.005675],
  zoom: initial_zoom,
  pitch: initial_pitch,
  bearing: initial_bearing,
  antialias: true
});

map.addControl(new mapboxgl.NavigationControl());

map.on('style.load', () => {
  // Insert the layer beneath any symbol layer.
  const layers = map.getStyle().layers;
  const labelLayerId = layers.find(
    (layer) => layer.type === 'symbol' && layer.layout['text-field']
  ).id;
  // The 'building' layer in the Mapbox Streets
  // vector tileset contains building height data
  // from OpenStreetMap.
  map.addLayer(
    {
      'id': 'add-3d-buildings',
      'source': 'composite',
      'source-layer': 'building',
      'filter': [
        'all',
        ['!=', ['id'], 44383237],
        ['!=', ['id'], 44383236],
        ['!=', ['id'], 253723359],
        ['!=', ['id'], 1081796637],
        ['!=', ['id'], 975016695],
        ['!=', ['id'], 975016694],
        ['!=', ['id'], 975016698],
        ['!=', ['id'], 975016697],
        ['!=', ['id'], 975016696],
        ['!=', ['id'], 1081796635],
        ['!=', ['id'], 1081796636],
        ['!=', ['id'], 253724106],
        ['!=', ['id'], 44383240]
      ],
      'type': 'fill-extrusion',
      'minzoom': 15,
      'paint': {
        'fill-extrusion-color': '#aaa',
        // Use an 'interpolate' expression to add a smooth transition effect to
        // the buildings as the user zooms in.
        'fill-extrusion-height': [
          'interpolate',
          ['linear'],
          ['zoom'],
          15,
          0,
          15.05,
          ['get', 'height']
        ],
        'fill-extrusion-base': [
          'interpolate',
          ['linear'],
          ['zoom'],
          15,
          0,
          15.05,
          ['get', 'min_height']
        ],
        'fill-extrusion-opacity': 0.6
      }
    },
    labelLayerId
  );
});


let stats;
import Stats from 'https://threejs.org/examples/jsm/libs/stats.module.js';
function animate() {
  requestAnimationFrame(animate);
  stats.update();
}

function addtypeone(i) {
  building_list.push(i)
  addbuildingScaleList.push([1, 1, 1])
  addbuildingMaterialList.push(1)
  if (!map.getLayer('custom-add_newbuilding_layer')) {
    map.addLayer({
      id: 'custom-add_newbuilding_layer',
      type: 'custom',
      renderingMode: '3d',
      onAdd: function (map, mbxContext) {

        var options = {
          obj: `./add_${i}.gltf`,
          type: 'gltf',
          units: 'meters',
          rotation: { x: 90, y: 0, z: 0 }, //default rotation
          anchor: 'center',
          selectable: true,
          draggable: true,
          rotatable: true,
          altitudeChangeable: false,
          clone: false
        }
        tb.loadObj(options, function (model) {
          let newBuilding = model.setCoords(field_location);
          newBuilding.addEventListener('SelectedChange', onSelectedChange, false);
          tb.add(newBuilding, `custom-add_newbuilding_layer`);
          for (let j = 0; j < model.children[0].children[0].children[0].children[0].children.length; j++) {
            model.children[0].children[0].children[0].children[0].children[j].material.color = materialIDtoRGB(1)   //set color to default
          }
        })
      },
      render: function (mbxContext, matrix) {
        tb.update();
      }
    });
  }
  else {
    var options = {
      obj: `./add_${i}.gltf`,
      type: 'gltf',
      units: 'meters',
      rotation: { x: 90, y: 0, z: 0 }, //default rotation
      anchor: 'center',
      selectable: true,
      draggable: true,
      rotatable: true,
      altitudeChangeable: false,
      clone: false
    }
    tb.loadObj(options, function (model) {
      let newBuilding = model.setCoords(field_location);
      newBuilding.addEventListener('SelectedChange', onSelectedChange, false); //
      tb.add(newBuilding, `custom-add_newbuilding_layer`);
      for (let j = 0; j < model.children[0].children[0].children[0].children[0].children.length; j++) {
        model.children[0].children[0].children[0].children[0].children[j].material.color = materialIDtoRGB(1)   //set color to default
      }
      tb.update()
    })
  }
  console.log(map.getLayer('custom-add_newbuilding_layer'))
};


function addElement(i, roomNumbers, options) {
  tb.loadObj(options, function (model) {
    //spinner showing when loading the BK model
    i < roomNumberArray.length - 1 ? showSpinner(true) : showSpinner(false)
    let currentRoom = []
    for (let j = 0; j < roomNumbers[i].length; j++) {
      model.children[0].children[0].children[0].children[roomNumbers[i][j]].material.format = THREE.RGBAFormat
      currentRoom.push(model.children[0].children[0].children[0].children[roomNumbers[i][j]])
    }
    model.children[0].children[0].children[0].children = currentRoom
    ElemntDic[i] = model
    roomSimuResult[i] = [-1, -1, -1, -1, -1, -1] // default value is -1
    if (i == 0) {
      model.selectable = false;
      for (let j = 0; j < model.children[0].children[0].children[0].children.length; j++) {
        model.children[0].children[0].children[0].children[j].material.color = { r: 0.45, g: 0.45, b: 0.45 }   //change the default green color of room 0 (roof)
      }
    } else {
      model.selectable = true;
    }
    model.rotatable = false;
    model.draggable = false;
    model.altitudeChangeable = false;
    model.setCoords(model_location);
    model.setRotation({ x: 0, y: 0, z: 50.5 });
    model.addEventListener('SelectedChange', SelectElement, false);
    model.addEventListener('ObjectDragged', Warning, false)
    tb.add(model, `custom-BKElement_layer`)
    console.log(i)
  })
}

function mapRoomNumber(roomNumbers, options) {
  tb.loadObj(options, function (model) {
    for (let j = 0; j < 9743; j++) {
      if (model.children[0].children[0].children[0].children[j].userData["Revit Element Info"]["RoomList"]) {
        model.children[0].children[0].children[0].children[j].userData["Revit Element Info"]["RoomList"].forEach(O => {
          if (O in roomNumbers) {
            let i = roomNumbers[O]
            i.push(j)
            roomNumbers[O] = i
          } else {
            roomNumbers[O] = [j]
          }
        })
      }
    }
    console.log(roomNumbers)
    // console.log(roomNumbers[1])
    return roomNumbers
  })
}


map.on('style.load', function () {
  // stats
  stats = new Stats();
  map.getContainer().appendChild(stats.dom);
  animate();

  map.addLayer({
    id: 'custom-BKElement_layer',
    type: 'custom',
    renderingMode: '3d',
    onAdd: function (map, mbxContext) {

      window.tb = new Threebox(
        map,
        mbxContext, //get the context from Mapbox
        {
          defaultLights: true,
          enableSelectingFeatures: false,
          enableSelectingObjects: true,
          enableDraggingObjects: true,
          enableRotatingObjects: true,
          enableTooltips: false
        }
      );

      var options = {
        obj: './BIGgltfNew.gltf',
        bin: './BIGgltf.bin',
        type: 'gltf',
        scale: 0.301,
        units: 'meters',
        rotation: { x: 90, y: 0, z: 0 },
        anchor: 'center',
        selectable: true,
        draggable: false,
        rotatable: false,
        altitudeChangeable: false
      }

      let roomNumbers = {}
      mapRoomNumber(roomNumbers, options)
      for (let i = 0; i < roomNumberArray.length; i++)
      {
        addElement(roomNumberArray[i], roomNumbers, options)
      }
    },

    render: function (gl, matrix) {
      tb.update();
    }
  });
})



function RemoveLast() {
  if (building_list.length === 0) {
    alert('Please add a building first.')
  }
  else {
    tb.world.children.pop()  //remove the last loaded obj in the world
    building_list.pop()  //number -1, also make sure 'undefiend' will not occur
    tb.update()
    map.repaint = true  //re-render
  }
}

function infoSelect() {
  let uuid_list = []
  tb.world.children.forEach((o) => { uuid_list.push(o.uuid) })
  uuid_list.shift()  //get uuid_list that align with building_list
  m = select_uuid;
  select_index = uuid_list.indexOf(m) //get index of the selected building 
  console.log(select_index) //477
  console.log(building_list) // [1,1,2...]
  selectBuildingType = building_list[select_index - 476] //1, 2 or 3   [select_index-477] is the index of building_List / material list
}

function deleteSelect() {
  infoSelect()
  if (if_selected) {
    tb.world.children.splice(select_index + 1, 1) //+1 because of BK building
    building_list.splice(select_index - 476, 1)
    addbuildingScaleList.splice(select_index - 476, 1)  //keep consistent with building_list.
    m = ''
    tb.update()  //re-render
    map.repaint = true
    console.log(building_list)
  } else {
    alert(`Please select a building you want to delet first.`)
  }
}


function applyScale() {
  infoSelect()
  if (if_selected) {
    x_scalefactor = depth_slider.valueAsNumber / 25
    y_scalefactor = width_slider.valueAsNumber / 25
    z_scalefactor = height_slider.valueAsNumber / 25
    selectedBuildingCoordinate = tb.unprojectFromWorld({ x: selectOS.position.x, y: selectOS.position.y, z: 0 })     //[4.372394151567398, 51.996629516150186, 68.59739966446513]
    console.log(selectedBuildingCoordinate)  // get latirtude longtitude
    //first delete
    tb.world.children.splice(select_index + 1, 1) //+1 because of BK building?
    building_list.splice(select_index - 476, 1)  //delete
    addbuildingScaleList.splice(select_index - 476, 1)  
    addbuildingMaterialList.splice(select_index - 476, 1) 

    building_list.push(selectBuildingType)   //add to the end
    addbuildingScaleList.push([x_scalefactor, y_scalefactor, z_scalefactor])  ///add to the end
    addbuildingMaterialList.push(selectBuildingMaterial) //add to the end

    m = ''
    console.log(building_list) //Scaled building moved to end; list length unchanged, order changes. Delete section ends.

    var options = {    //here must already be a custom-add_newbuilding_layer.
      obj: `./add_${selectBuildingType}.gltf`,
      type: 'gltf',
      scale: { x: x_scalefactor, y: y_scalefactor, z: z_scalefactor },
      units: 'meters',
      rotation: { x: 90, y: 0, z: 0 }, //default rotation
      anchor: 'center',
      selectable: true,
      draggable: true,
      rotatable: true,
      altitudeChangeable: false,
      clone: false
    }
    tb.loadObj(options, function (model) {
      let newBuilding = model.setCoords([selectedBuildingCoordinate[0], selectedBuildingCoordinate[1]]);
      newBuilding.addEventListener('SelectedChange', onSelectedChange, false); //
      tb.add(newBuilding, `custom-add_newbuilding_layer`);
      for (let j = 0; j < model.children[0].children[0].children[0].children[0].children.length; j++) {
        model.children[0].children[0].children[0].children[0].children[j].material.color = materialIDtoRGB(selectBuildingMaterial)   //set color as the same as the previous one
      }
      tb.update()
    })

  } else {
    alert(`Please select a building you want to scale first.`)
  }
  tb.update()
  map.repaint = true  //re-render 
}


function showMaterial() {
  infoSelect()
  let material
  let imageSrc
  selectBuildingMaterial = addbuildingMaterialList[select_index - 476]
  switch (selectBuildingMaterial) {
    case 1:
      material = `Brick`;
      imageSrc = 'brick.jpg';
      break;
    case 2:
      material = `Float glass`;
      imageSrc = 'glass_1.jpg';
      break;
    case 3:
      material = `Reflective glass`;
      imageSrc = 'glass_2.jpg';
  }
  const materialSpan = `<span class='result'>${material}</span>`;
  const imageSpan = `<span class='result'><img src="${imageSrc}" style="width: 60px; height: 15px;"></span>`;
  messageMaterial = "The facade's material is " + materialSpan + " " + imageSpan;
  document.getElementById("material-result").innerHTML = messageMaterial;

}


function onSelectedChange(e) {
  let selectedValue = e.detail.selected; //get if the object is selected after the event
  let selectedObject = e.detail.uuid; //get the object selected/unselected 
  if_selected = selectedValue
  if (selectedValue) {
    if_selected = 1 //set true
    select_uuid = selectedObject  //only get uui when the building is selected
    selectOS = e.detail
    console.log(selectOS)
    console.log(tb)
    showMaterial()
  } else {
    if_selected = 0 //set false
    hideshowMaterial()
  }
}

function SelectElement(e) {
  let selectedValue = e.detail.selected;
  if (selectedValue) {
    console.log(e.detail.uuid)
    console.log(e.detail) //Os
    console.log(ElemntDic) //{0: Os, 1: Os, 3: Os...} 
    selectRoomNum = getKeyByValue(ElemntDic, e.detail)
    console.log(selectRoomNum) 
    console.log(roomNumLevel[selectRoomNum]) //1st floor / BG...
    getSimulationLocation()
    console.log(simulation_location)

    let chosenRoom
    for (let i = 0; i < roomNumberArray.length; i++) {   //building_list.lengt    i < roomNumberArray.length
      if (tb.world.children[i].uuid != e.detail.uuid) {
        for (let j = 0; j < tb.world.children[i].children[0].children[0].children[0].children.length; j++) {
          // console.log(j)
          tb.world.children[i].children[0].children[0].children[0].children[j].material.opacity = 0.03;
          tb.world.children[i].children[0].children[0].children[0].children[j].material.transparent = true;
          tb.world.children[i].children[0].children[0].children[0].children[j].material.depthWrite = false;
        }
      } else {
        chosenRoom = i
      }
    }
    console.log(tb.world.children[chosenRoom])
    for (let j = 0; j < tb.world.children[chosenRoom].children[0].children[0].children[0].children.length; j++) {
      tb.world.children[chosenRoom].children[0].children[0].children[0].children[j].material.opacity = 1;
      tb.world.children[chosenRoom].children[0].children[0].children[0].children[j].material.transparent = false;
      tb.world.children[chosenRoom].children[0].children[0].children[0].children[j].material.depthWrite = true;
    }
  }
}


function getSimulationLocation() {
  selectRoomLevel = roomNumLevel[selectRoomNum]
  selectwholeobject = ElemntDic[selectRoomNum]
  simulation_location[0] = parsedObject[selectRoomNum][0]
  simulation_location[1] = parsedObject[selectRoomNum][1]
  if (metrics != 4) {
    if (eyeHeight == 0.8) {
      switch (selectRoomLevel) {
        case `BG`:
          simulation_location[2] = 0.15 + 0.75
          break;
        case `BG+`:
          simulation_location[2] = 0.9 + 2.7
          break;
        case `1st floor`:
          simulation_location[2] = 0.9 + 5.7
          break;
        case `1st floor +`:
          simulation_location[2] = 0.9 + 5.7 + 3.2
          break;
        case `2nd`:
          simulation_location[2] = 0.9 + 5.7 + 5.9
      }
    } else {  //eyeheight = 1.2
      switch (selectRoomLevel) {
        case `BG`:
          simulation_location[2] = 0.15 + 0.75 + 0.4
          break;
        case `BG+`:
          simulation_location[2] = 0.9 + 2.7 + 0.4
          break;
        case `1st floor`:
          simulation_location[2] = 0.9 + 5.7 + 0.4
          break;
        case `1st floor +`:
          simulation_location[2] = 0.9 + 5.7 + 3.2 + 0.4
          break;
        case `2nd`:
          simulation_location[2] = 0.9 + 5.7 + 5.9 + 0.4
      }
    }
  } else {
    switch (selectRoomLevel) {
      case `BG`:
        simulation_location[2] = 0.15 + 0.75 - 0.8
        break;
      case `BG+`:
        simulation_location[2] = 0.9 + 2.7 - 0.8 
        break;
      case `1st floor`:
        simulation_location[2] = 0.9 + 5.7 - 0.8
        break;
      case `1st floor +`:
        simulation_location[2] = 0.9 + 5.7 + 3.2 - 0.8
        break;
      case `2nd`:
        simulation_location[2] = 0.9 + 5.7 + 5.9 - 0.8
    }
  }
}


function roomPreview() {
  let e = document.getElementById("roomChoice")
  console.log(e.value.replace(/ /g, ''))  //remove space in front of roomname string, "01.Mid.802"
  console.log(roomNumName[e.value.replace(/ /g, '')]) //  get the room number   5
  selectRoomNum = roomNumName[e.value.replace(/ /g, '')] ////  selectRoomNum = 5
  console.log(selectRoomNum)
  console.log(typeof selectRoomNum) // number
  console.log(roomNumLevel[selectRoomNum]) //1st floor / BG...
  ElemntDic[selectRoomNum].drawBoundingBox() // OS get boundingbox
  console.log(ElemntDic[selectRoomNum])
  console.log(ElemntDic[selectRoomNum].children[0].children[1].children[0]) // print OS's boundingbox
  if (!e) {
    alert(`Please select a room first`)
  } else {
    let chosenRoom
    for (let i = 0; i < roomNumberArray.length; i++) {
      if (tb.world.children[i].uuid != ElemntDic[roomNumName[e.value.replace(/ /g, '')]].uuid) {
        for (let j = 0; j < tb.world.children[i].children[0].children[0].children[0].children.length; j++) {
          tb.world.children[i].children[0].children[0].children[0].children[j].material.opacity = 0.03;
          tb.world.children[i].children[0].children[0].children[0].children[j].material.transparent = true;
          tb.world.children[i].children[0].children[0].children[0].children[j].material.depthWrite = false;
        }
      } else {
        chosenRoom = i
      }
    }
    for (let j = 0; j < tb.world.children[chosenRoom].children[0].children[0].children[0].children.length; j++) {
      tb.world.children[chosenRoom].children[0].children[0].children[0].children[j].material.opacity = 1;
      tb.world.children[chosenRoom].children[0].children[0].children[0].children[j].material.transparent = false;
      tb.world.children[chosenRoom].children[0].children[0].children[0].children[j].material.depthWrite = true;
    }
    tb.update()
    map.repaint = true  //re-render 
    getSimulationLocation()
    const cc = tb.unprojectFromWorld({ x: -12432.753777777778 - 4.2784755694866305, y: -173783.8192488242 + 42.04665083408355, z: 2.85 })     //[4.372394151567398, 51.996629516150186, 68.59739966446513]
    console.log(cc)  // get lat long
  }
}


function Warning(e) {
  alert(`You can't rotate or drag BK building elements.`)
}

function onObjectMouseOver(e) {
  console.log("ObjectMouseOver: " + e.detail.name);
}

//actions to execute onObjectMouseOut
function onObjectMouseOut(e) {
  console.log("ObjectMouseOut: " + e.detail.name);
}


function RemoveAllAddBuildings() {
  console.log(map.getLayer('custom-add_newbuilding_layer'))
  if (map.getLayer('custom-add_newbuilding_layer')) { tb.clear('custom-add_newbuilding_layer') }
  //reset all info to undefined
  building_list = []
  addbuildingMaterialList = []
  addbuildingScaleList = []
  select_uuid = undefined
  select_index = undefined
  if_selected = 0  //boolean checkIfAnyAddBuildingSelected 
  selectedBuildingCoordinate = undefined
  selectBuildingType = undefined
  selectBuildingMaterial = undefined
  x_scalefactor = undefined,
    y_scalefactor = undefined,
    z_scalefactor = undefined
  selectOS = undefined //e.detail of added buildings
  tb.update()
  map.repaint = true  //re-render 
}


const coord = new mapboxgl.MercatorCoordinate(115.67108538937568, 48.64140290737152, 0.44438976716992984);
const lngLat = coord.toLngLat(); // LngLat(0, 0)
const alti = coord.toAltitude(); // coord.toAltitude()
console.log(lngLat)
console.log(alti)
const coord_1 = mapboxgl.MercatorCoordinate.fromLngLat({ lng: 4.370890, lat: 52.005730 }, -2.85);
console.log(coord_1); // MercatorCoordinate(0.5, 0.5, 0)




