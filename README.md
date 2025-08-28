# App Server for Case Study (Threebox + Rhino Compute + Rhino App Server)

This app server is built on top of **Threebox**, **Rhino Compute**, and the **Rhino App Server**.

> ⚠️ To run this case study you must install the required software and obtain several **sensitive files** (see **Step 1**). Do **not** skip any steps.

---
## Prerequisites

1. **Rhino 7 or 8**  
   Download: <https://www.rhino3d.com/>

2. **Visual Studio**  
   Download: <https://visualstudio.microsoft.com/>

3. **Rhino Compute**  
   Download ZIP: <https://github.com/mcneel/compute.rhino3d>

4. **Node.js + npm**
   More details in step 2.

5. **Mapbox GL access token**  
   Create an account and retrieve your token: <https://console.mapbox.com/account/access-tokens/>

---

## Mapbox Token Setup

You **must** place your Mapbox token in the following files for the web server and floor grid retrieval to work:

- `appserver/src/examples/thesis/script.js` **line 636** (for the web server to run)  
- `appserver/src/examples/thesisFloor/script.js` **line 412** (for retrieving the floor coordinates for the simulation grid to load in the Mapbox environment later)

---

## How to Run (Step-by-Step)

### Step 1: Download this repository + request access to sensitive documents

Because the files listed below contain **sensitive information** for this case study (data for the BK building model), they are **not** published on GitHub.

If you need them, please contact: **Dr. A. (Azarakhsh) Rafiee** via **A.Rafiee@tudelft.nl**.

You will need access to:

1. **All of the Grasshopper files**
2. `thesis/BIGgltfNew.gltf`
3. `thesis/BIGgltf.bin`
4. `thesisFloor/BIGgltfNew.gltf`
5. `thesisFloor/BIGgltf.bin`

Once you have access to the above files, place them as follows:

- Create a subfolder:  
  `appserver/src/files`  
  Put **all Grasshopper files (1)** in:  
  `appserver/src/files`

- Put **(2) `thesis/BIGgltfNew.gltf`** and **(3) `thesis/BIGgltf.bin`** in:  
  `appserver/src/examples/thesis`

- Put **(4) `thesisFloor/BIGgltfNew.gltf`** and **(5) `thesisFloor/BIGgltf.bin`** in:  
  `appserver/src/examples/thesisFloor`

---
## Step 2: Install npm (Node.js + npm) on Windows

### 1. Download Node.js (comes with npm)

- Go to <https://nodejs.org>
- Choose the **LTS** (Long-Term Support) version (recommended for most users).
- Download the **Windows Installer (.msi)**.

### 2. Run the installer

- Open the downloaded **.msi** file.
- Follow the setup wizard:
  - Accept the license agreement.
  - Choose the installation path (default is fine).
  - Ensure **“npm package manager”** is checked in the components list.
  - *(Optional)* Allow the installer to update **PATH** automatically.
- Click **Install**.

### 3. Verify installation

Open **Command Prompt (cmd)** or **PowerShell** and run:

```bash
node -v
```
This shows the installed Node.js version.

```bash
npm -v
```
This shows the installed npm version.

### 4. Installing dependencies

From the **`compute.rhino3d.appserver`** folder, open a PowerShell instance and run:

```bash
npm i
```
---

### Step 3: Start Rhino Compute

1. Unpack the Rhino Compute ZIP.
2. In the `src` folder, open **`compute.sln`** with **Visual Studio**.
3. Choose **`rhino.compute`** and click **`start`**.
   
   ![Choose rhino.compute in Visual Studio](https://github.com/user-attachments/assets/9c6244c2-121f-420c-96ff-9153a85b148a)

4. Wait until you receive the message **`Max concurrent requests = 0`**.  
   This indicates Rhino Compute is running and ready to respond.

---

### Step 4: Run the app server

From the **`appserver`** folder:

- **Right-click** → **Open in Terminal** (or open PowerShell in that folder)
- Run:

```bash
npm run start
```

---

### Step 5: Open the web application and run the simulation

1. Open (click or copy/paste) the URL in any web browser:  
   `http://localhost:3000/examples/thesis`
2. Wait for the model to load. (This takes some time)
3. Use the interface to set simulation settings.
4. Click a room on the model to select it for simulation.
5. Click the **“Compute”** button.

---

## Credits

- **Threebox:** <https://github.com/jscastro76/threebox>  
- **Rhino App Server:** <https://github.com/mcneel/compute.rhino3d.appserver>  
- **Rhino Compute:** <https://github.com/mcneel/compute.rhino3d>

---

![GitHub package.json version](https://img.shields.io/github/package-json/v/mcneel/compute.rhino3d.appserver/main?label=version&style=flat-square)
![node-current (scoped)](https://img.shields.io/badge/dynamic/json?label=node&query=engines.node&url=https%3A%2F%2Fraw.githubusercontent.com%2Fmcneel%2Fcompute.rhino3d.appserver%2Fmain%2Fpackage.json&style=flat-square&color=dark-green)

# Rhino Compute AppServer
A node.js server acting as a bridge between client apps and private compute.rhino3d servers.

This app is intended to host one or more custom grasshopper definitions and serve as the API that client applications can call to have definitions solved with modified input parameters.

## Features
- **Easy to get started**: fork/clone this repo and run it locally for testing or push to a service like Heroku for a production web server
- **Easy to customize**: fork this repo, place your custom grasshopper definitions in the files directory and you now have a custom AppServer for your definitions.
- **Caching**: Assuming definitions produce the same results when the same set of inputs are provided, the appserver caches all results in memory for faster response times.
- **Timings**: Server-timing headers are returned to the client to help diagnose bottlenecks in the definition solving process.

## Getting Started
1. Fork this repo
2. Follow the [installation guide](docs/installation.md) to test and debug on your computer
3. Follow the [Heroku hosting guide](docs/heroku.md) to push your customized AppServer to Heroku for a production web server

## How and What Video
- A workshop on using the appserver can be found at https://vimeo.com/442079095 - also [slides](https://docs.google.com/presentation/d/1nCbd87iA_D2ZCwoSirOYK3har6XUJHDUEIkt635btUU)
- AECTECH 2020 workshop: https://youtu.be/At4BaIuEE3c - [slides](https://docs.google.com/presentation/d/1uY6DcYpBNrgxk8sbHHv1gy3IZWRmO7QF1rUT1XOl3s0/edit?usp=drivesdk)

## Examples
When we have our testing server up and running, you can visit to see various samples:

https://compute-rhino3d-appserver.herokuapp.com/examples/

----
## Other Information
- [API Endpoints](docs/endpoints.md) the server supports
- [Client Code](docs/clientcode.md) example for calling the AppServer
