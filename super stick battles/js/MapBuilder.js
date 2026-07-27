let isBuilding = false;
let builderRects = [];
let drawStartX = 0;
let drawStartY = 0;
let isDrawing = false;
let currentCustomMapName = "";

document.getElementById('enter-builder-btn').addEventListener('click', () => {
    const name = document.getElementById('custom-map-name').value.trim();
    if (!name) {
        alert("Please enter a map name first!");
        return;
    }
    
    currentCustomMapName = name;
    isBuilding = true;
    
    // Hide UI, show builder overlay
    document.getElementById('ui-container').classList.add('hidden');
    document.getElementById('builder-overlay').classList.remove('hidden');
    
    // Reset drawing state
    builderRects = [];
    
    // Setup a clean Matter.js world just for rendering the background grid, or we can just draw on canvas manually.
    // We'll hook into a custom render loop for the builder in main.js.
});

document.getElementById('exit-builder-btn').addEventListener('click', () => {
    isBuilding = false;
    document.getElementById('ui-container').classList.remove('hidden');
    document.getElementById('builder-overlay').classList.add('hidden');
    
    // Update map selects with custom maps
    populateMapSelects();
});

document.getElementById('save-map-btn').addEventListener('click', () => {
    const customMaps = JSON.parse(localStorage.getItem('ssb_custom_maps') || '{}');
    customMaps[currentCustomMapName] = builderRects;
    localStorage.setItem('ssb_custom_maps', JSON.stringify(customMaps));
    alert("Map saved successfully!");
});

function handleBuilderMouseDown(e) {
    if (!isBuilding) return;
    isDrawing = true;
    drawStartX = e.clientX - window.innerWidth/2; // rough world translation
    drawStartY = e.clientY - window.innerHeight/2;
}

function handleBuilderMouseUp(e) {
    if (!isBuilding || !isDrawing) return;
    isDrawing = false;
    
    const endX = e.clientX - window.innerWidth/2;
    const endY = e.clientY - window.innerHeight/2;
    
    const w = Math.abs(endX - drawStartX);
    const h = Math.abs(endY - drawStartY);
    const x = Math.min(drawStartX, endX);
    const y = Math.min(drawStartY, endY);
    
    if (w > 10 && h > 10) {
        builderRects.push({ x, y, w, h });
    }
}

// Global hooks for main.js to call
window.addEventListener('mousedown', handleBuilderMouseDown);
window.addEventListener('mouseup', handleBuilderMouseUp);

function populateMapSelects() {
    const select = document.getElementById('map-select');
    // Keep defaults
    select.innerHTML = `
        <option value="arena">The Arena</option>
        <option value="islands">Floating Islands</option>
        <option value="pit">The Pit</option>
        <option value="bridge">The Bridge</option>
        <option value="stairway">Stairway to Heaven</option>
        <option value="bouncy">Bouncy Castle</option>
        <option value="cage">The Cage</option>
    `;
    
    const customMaps = JSON.parse(localStorage.getItem('ssb_custom_maps') || '{}');
    Object.keys(customMaps).forEach(mapName => {
        const opt = document.createElement('option');
        opt.value = mapName;
        opt.innerText = `Custom: ${mapName}`;
        select.appendChild(opt);
    });
}

// Initial populate
populateMapSelects();
