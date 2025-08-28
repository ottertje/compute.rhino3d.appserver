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
const downloadJSON = document.getElementById('download')
downloadJSON.addEventListener('click', download, false)

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


const material_1 = document.getElementById('material-1');
material_1.addEventListener('click', () => { applyMaterial(1) }, false);

const material_2 = document.getElementById('material-2');
material_2.addEventListener('click', () => { applyMaterial(2) }, false);

const material_3 = document.getElementById('material-3');
material_3.addEventListener('click', () => { applyMaterial(3) }, false);

const aaaaa = document.getElementById('get-simulation-location')
aaaaa.addEventListener('click', getSimulationLocation, false)



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
      return {r: 0.909, g: 0.768, b: 0.662}
    case 2: //blue
      return {r: 0.796, g: 0.941, b: 0.949}
    case 3: //yellow
      return {r: 0.909, g: 0.886, b: 0.662}
  }
}

function hideshowMaterial() {
  messageMaterial = ""
  document.getElementById("material-result").innerHTML = messageMaterial;
}

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
let getFloorBoundingboxInfo = {}
//current selection of BK building
let selectRoomNum
let selectRoomLevel
let selectwholeobject  //get the object of the whole room Os:{....}
let m  //copy of select_uuid

//Rhino compute
let rhinoModel
let messageSimulation 
let simulation_data = 0.5

//comparison
let previousNum_1, previousNum_2, previousNum_3
let comparisonResult
let comparisonNum

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
  computePress = true
  compute(i)
  showSpinner(true) // show spinner
};

// load the rhino3dm library
let doc
console.log('Calling rhino3dm.')
const rhino = await rhino3dm()
console.log('Loaded rhino3dm.')

//  Call appserver
async function compute(i) {
  if (!selectedRoomCoordinate) {
    alert(`Please select a room first!`)
  } else {
    let t0 = performance.now()
    const timeComputeStart = t0

    let rotation_all = []
    let latitude_m = 40075000 / 360
    let longtiude_m = (40075000 * Math.cos(52.007102014389176 * (Math.PI / 180))) / 360
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


    tb.world.children.forEach((o) => { rotation_all.push(((o.rotation.z) * (180 / Math.PI))) })
    tb.world.children.forEach((o) => { longt.push(((o.coordinates[0]) - 4.371029663172603) * longtiude_m) })
    tb.world.children.forEach((o) => { lati.push(((o.coordinates[1]) - 52.007102014389176) * latitude_m) })    //4.371029663172603, 52.007102014389176

    rotation_all.shift()  //remove the BK building (first item of the list)
    lati.shift()  //remove the BK building(first item of the list)
    longt.shift()  //remove the BK building(first item of the list)

    for (let i = 0; i < building_list.length; i++) {
      switch (building_list[i]) {
        case 1:
          rotation_type1.push(rotation_all[i])
          lati_type1.push(lati[i])
          longt_type1.push(longt[i])
          break;
        case 2:
          rotation_type2.push(rotation_all[i])
          lati_type2.push(lati[i])
          longt_type2.push(longt[i])
          break;
        case 3:
          rotation_type3.push(rotation_all[i])
          lati_type3.push(lati[i])
          longt_type3.push(longt[i])
      }
    }


    // collect data from inputs
    let data = {}
    data.definition = `selectRoom_${i}.gh`
    data.inputs = {
      'SelectedRoom': 472
    }
    console.log(data.inputs)

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

      switch (i) {
        case 1:
          simulation_data = responseJson.values[1].InnerTree['{0;0}'].map(d => d.data) //["", "", ""]
          simulation_data[0] = parseFloat(simulation_data[0].replace(/"/g, '')).toFixed(2)
          simulation_data[1] = parseFloat(simulation_data[1].replace(/"/g, '')).toFixed(2)
          messageSimulation = "The mean DA value of the room is <span class='result'>" + simulation_data[0] + "%</span>" + " with a standard deviation of <span class='result'>" + simulation_data[1] + "%</span>";
          break;
        case 2:
          simulation_data = responseJson.values[1].InnerTree['{0;0;0}'].map(d => d.data) //gh_2 sDA
          simulation_data[0] = parseFloat(simulation_data[0].replace(/"/g, '')).toFixed(2)
          messageSimulation = "The sDA value of the room is <span class='result'>" + simulation_data[0] + "</span>";
          break;
        case 3:
          simulation_data = responseJson.values[1].InnerTree['{0;0}'].map(d => d.data) //["", "", "",""]
          simulation_data[0] = parseFloat(simulation_data[0].replace(/"/g, '')).toFixed(2)
          simulation_data[1] = parseFloat(simulation_data[1].replace(/"/g, '')).toFixed(2)
          simulation_data[2] = parseFloat(simulation_data[2].replace(/"/g, '')).toFixed(2)
          simulation_data[3] = parseFloat(simulation_data[3].replace(/"/g, '')).toFixed(2)
          messageSimulation = "The mean UDI of the room is <span class='result'>" + simulation_data[0] + "%</span>" + " with a standard deviation of <span class='result'>" + simulation_data[1] + "%</span>.  Annually <span class='result'>" + simulation_data[2] + "%</span>" + "of the time it is too dark, and <span class='result'>" + simulation_data[3] + "%</span> of the time it might cause glare.";
      }

      // Display the message on the webpage
      document.getElementById("resultMessage").innerHTML = messageSimulation; 

    } catch (error) {
      console.error(error)
    }

  }

  function collectResults(responseJson) {
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
            anchor: 'center',
          }
          rhinoModel = tb.Object3D(options);
          rhinoModel.selectable = false;
          rhinoModel.draggable = false;
          rhinoModel.rotatable = false;
          rhinoModel.altitudeChangeable = false;
          rhinoModel.setCoords(simulation_location);
          // model.addEventListener('SelectedChange', DaylightResult, false);
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


// Mapbox
// Please enter the mapbox token, you can retrive your token from: https://console.mapbox.com/account/access-tokens/:
mapboxgl.accessToken = 'Fill in own mapbox token';
const initial_center = [4.370547, 52.005620, 0];
const model_location = [4.370890, 52.005730, -1.7]
const model_location2 = [4.370123, 52.006710, 50]

let selectedRoomCoordinate = []

let simulation_location = [4.370045072533668, 52.00486177059497, 1.87582]     //4.370045072533668, 52.00486177059497
const field_location = [4.371029663172603, 52.007102014389176]
const initial_zoom = 15.5
const initial_pitch = 45
const initial_bearing = -17.6


let styleList = document.getElementById('menu');
let inputs = styleList.getElementsByTagName('input');
for (let i = 0; i < inputs.length; i++) {
  inputs[i].onclick = switchLayer;
}

function switchLayer(layer) {
  if (layerId != layer.target.id) {
    layerId = layer.target.id;
    tb.setStyle('mapbox://styles/mapbox/' + layerId);
  }
}
var map = new mapboxgl.Map({
  container: 'mapID',
  style: 'mapbox://styles/mapbox/light-v11',
  // center: initial_center,
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
      // 'filter': ['==', 'extrude', 'true'],
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
        //set color to default
        model.children[0].children[0].children[0].children[0].children[j].material.color = materialIDtoRGB(1)   
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

    if (i == 0) {
      model.selectable = false;
      for (let j = 0; j < model.children[0].children[0].children[0].children.length; j++) {
        //change the default green color of room 0 (roof)
        model.children[0].children[0].children[0].children[j].material.color = {r: 0.45, g: 0.45, b: 0.45}   
      }
    } else {
      model.selectable = true;

    }
    model.drawBoundingBox()
    model.rotatable = false;
    model.draggable = false;
    model.altitudeChangeable = false;
    model.setCoords(model_location);
    model.setRotation({ x: 0, y: 0, z: 50.5 });
    model.addEventListener('SelectedChange', SelectElement, false);
    model.addEventListener('ObjectDragged', Warning, false)
    tb.add(model, `custom-BKElement_layer`)

    const radRotate = 50.5 * (Math.PI / 180)  //50.5 degrees of rotation, = 0,8813913
    const old_x = model.children[0].children[1].children[0].position.x
    const old_y = model.children[0].children[1].children[0].position.y
    const new_x = old_x * Math.cos(radRotate) - old_y * Math.sin(radRotate)
    const new_y = old_x * Math.sin(radRotate) + old_y * Math.cos(radRotate)

    selectedRoomCoordinate = tb.unprojectFromWorld({ x: -12432.753777777778 + new_x * 0.0415552, y: -173783.8192488242 + new_y * 0.0415552, z: 2.85 })     //[4.372394151567398, 51.996629516150186, 68.59739966446513]
    getFloorBoundingboxInfo[i] = [selectedRoomCoordinate[0], selectedRoomCoordinate[1]]
    console.log(getFloorBoundingboxInfo)  //{0: Array(2), 1: Array(2), 3: Array(2), 4: Array(2), 5: Array(2), 6: Array(2), 7: Array(2), 9: Array(2), 12: Array(2),...}

    console.log(i)
  })
}

function mapRoomNumber(roomNumbers, options) {
  console.log("Start")
  tb.loadObj(options, function (model) {
    console.log("Start Inside")
    for (let j = 0; j < 9743; j++) {
      if (model.children[0].children[0].children[0].children[j].userData["Revit Element Info"]["RoomList"] 
          && (model.children[0].children[0].children[0].children[j].userData["name"] == "Generic 150mm")) {
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
    console.log("Done Inside")
    return roomNumbers
  })
  console.log("Done")
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
        // rotation: { x: 90, y: 50.5, z: 0 }, //default rotation
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

      // Convert JavaScript object to JSON string
      let floorjsonString = JSON.stringify(getFloorBoundingboxInfo);
      // Save jsonString to a file or store it locally
      localStorage.setItem('myData', floorjsonString);
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
  console.log(building_list)
  //get the type of added building (selected)   1, 2 or 3,  [select_index-477] is the index of building_List / material list
  selectBuildingType = building_list[select_index - 477] //1, 2 or 3  
  console.log(selectBuildingType)
}

function deleteSelect() {
  infoSelect()
  if (if_selected) {
    tb.world.children.splice(select_index + 1, 1) //+1 because of BK building itself
    building_list.splice(select_index - 477, 1)
    // to align with the building_list
    addbuildingScaleList.splice(select_index - 477, 1)
    m = ''
    tb.update()  //re-render
    map.repaint = true
    console.log(building_list) //delete Buildinglist [1, 3]
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
    tb.world.children.splice(select_index + 1, 1) //+1 because of BK building itself

    building_list.splice(select_index - 477, 1)  
    // align with the building_list
    addbuildingScaleList.splice(select_index - 477, 1)  
    addbuildingMaterialList.splice(select_index-477, 1)

    //add to the end
    building_list.push(selectBuildingType)   
    addbuildingScaleList.push([x_scalefactor, y_scalefactor, z_scalefactor])  
    addbuildingMaterialList.push(selectBuildingMaterial)

    m = ''
    // Place the scaled buildings at the end. The total number of items in the list remains the same, but the order will change. 
    // End of the delete section
    console.log(building_list) 

    var options = {    
      //the layer called `custom-add_newbuilding_layer`already exists
      obj: `./add_${selectBuildingType}.gltf`,
      type: 'gltf',
      scale: { x: x_scalefactor, y: y_scalefactor, z: z_scalefactor },
      units: 'meters',
      rotation: { x: 90, y: 0, z: 0 }, //default rotation
      anchor: 'center',
      selectable: true,
      draggable: true,
      rotatable: true,
      altitudeChangeable: false
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
  selectBuildingMaterial = addbuildingMaterialList[select_index-477]
  switch (selectBuildingMaterial) {
    case 1:
      material = `Brick`;
      imageSrc = 'brick.jpg';
      break;
    case 2:
      material = `Transparent glass`;
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
  //get if the object is selected after the event
  let selectedValue = e.detail.selected; 
  //get the object selected/unselected 
  let selectedObject = e.detail.uuid; 
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
    console.log(ElemntDic) //{0: Os, 1: Os, 3: Os...} Os -> object, 
    selectRoomNum = getKeyByValue(ElemntDic, e.detail)
    console.log(selectRoomNum) //room selected  472(string)
    console.log(roomNumLevel[selectRoomNum]) //1st floor / BG...
    getSimulationLocation()
    console.log(simulation_location)

    let chosenRoom
    // Use building_list.length to avoid making the added buildings transparent  
    for (let i = 0; i < roomNumberArray.length - building_list.length; i++) {  
      if (tb.world.children[i].uuid != e.detail.uuid) {
        for (let j = 0; j < tb.world.children[i].children[0].children[0].children[0].children.length; j++) {
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
  // console.log(selectwholeobject) //get the object of the whole room Os:{....}
  const radRotate = 50.5 * (Math.PI / 180)  //50.5 degrees of rotation, = 0,8813913
  const old_x = selectwholeobject.children[0].children[1].children[0].position.x
  const old_y = selectwholeobject.children[0].children[1].children[0].position.y
  const new_x = old_x * Math.cos(radRotate) - old_y * Math.sin(radRotate)
  const new_y = old_x * Math.sin(radRotate) + old_y * Math.cos(radRotate)
  selectedRoomCoordinate = tb.unprojectFromWorld({ x: -12432.753777777778 + new_x * 0.0415552, y: -173783.8192488242 + new_y * 0.0415552, z: 2.85 })     //[4.372394151567398, 51.996629516150186, 68.59739966446513]
  console.log(selectedRoomCoordinate)  // get latirtude longtitude
  simulation_location[0] = selectedRoomCoordinate[0]
  simulation_location[1] = selectedRoomCoordinate[1]
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
        console.log(getFloorBoundingboxInfo)

}


function roomPreview() {
  let e = document.getElementById("roomChoice")
  console.log(e.value.replace(/ /g, ''))  //remove space in front of roomname string, "01.Mid.802"
  console.log(roomNumName[e.value.replace(/ /g, '')]) //  get the room number   5
  selectRoomNum = roomNumName[e.value.replace(/ /g, '')] //  selectRoomNum = 5
  console.log(selectRoomNum)
  console.log(typeof selectRoomNum) 
  // number (different from the select function — that one’s number is a string, 
  // but both can be used to get the room level)
  console.log(roomNumLevel[selectRoomNum]) //1st floor / BG...
  ElemntDic[selectRoomNum].drawBoundingBox() // OS get boundingbox
  console.log(ElemntDic[selectRoomNum])
  console.log(ElemntDic[selectRoomNum].children[0].children[1].children[0]) // print OS's boundingbox

  if (!e) {
    alert(`Please select a room first`)
  } else {
    let chosenRoom
    for (let i = 0; i < roomNumberArray.length - building_list.length; i++) {
      // console.log(tb.world.children[i].uuid)
      if (tb.world.children[i].uuid != ElemntDic[roomNumName[e.value.replace(/ /g, '')]].uuid) {
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


function download() {
   // Convert JSON object to string
   const jsonString = JSON.stringify(getFloorBoundingboxInfo, null, 2);      
   const blob = new Blob([jsonString], { type: 'application/json' });    // Create Blob object
   const url = URL.createObjectURL(blob);    // Create URL for the Blob object
   const a = document.createElement('a');    // Create anchor element
   a.href = url;    // Set href attribute of anchor element
   a.download = 'floordata.json';    // Set download attribute of anchor element
   document.body.appendChild(a);    // Append anchor element to body

   a.click();
   document.body.removeChild(a);
   // Revoke URL
   URL.revokeObjectURL(url);
}