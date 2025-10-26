let scene, camera, renderer, wall, wallEdges, gridHelper;
let shapes = [];
let selectedShape = null;
let currentTool = 'rectangle';
let showMeasurements = true;
let isDrawing = false;
let isRotating = false;
let isMoving = false;
let isPanning = false;
let drawStart = null;
let tempShape = null;
let moveOffset = null;
let cameraTarget = new THREE.Vector3(0, 0, 0);
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let cameraRotation = { x: 0, y: 0 };
let lastMousePos = { x: 0, y: 0 };
let roomWidth = 400;
let roomHeight = 300;
let distanceLines = [];
let measurementScale = 0.5;
let lineWidth = 2;
let showObjectDimensions = true;
let showDistanceLines = true;
let isLightTheme = false;

init();
animate();
initCollapsibleSections();

function init() {
    const container = document.getElementById('canvas-container');
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        10000
    );
    camera.position.set(0, 150, 400);
    camera.lookAt(0, 150, 0);
    
    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(200, 400, 300);
    scene.add(directionalLight);
    
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-200, 200, -100);
    scene.add(directionalLight2);
    
    createWall();
    createGrid();
    setupEventListeners();
}

function createWall() {
    if (wall) {
        scene.remove(wall);
    }
    
    const wallGeometry = new THREE.PlaneGeometry(roomWidth, roomHeight);
    const wallColor = isLightTheme ? 0xf5f5f5 : 0xe0e0e0;
    const wallOpacity = isLightTheme ? 0.8 : 0.3;
    
    const wallMaterial = new THREE.MeshPhongMaterial({
        color: wallColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: wallOpacity
    });
    wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.set(0, roomHeight / 2, 0);
    scene.add(wall);
    
    const edgeColor = isLightTheme ? 0x333333 : 0x666666;
    const wallEdgesGeom = new THREE.EdgesGeometry(wallGeometry);
    wallEdges = new THREE.LineSegments(
        wallEdgesGeom,
        new THREE.LineBasicMaterial({ color: edgeColor, linewidth: 2 })
    );
    wall.add(wallEdges);
    
    cameraTarget.set(0, roomHeight / 2, 0);
    camera.position.set(0, roomHeight / 2, roomHeight * 1.5);
    camera.lookAt(cameraTarget);
    updateCameraPosition();
}

function createGrid() {
    if (gridHelper) {
        scene.remove(gridHelper);
    }
    
    const gridColor1 = isLightTheme ? 0xcccccc : 0x444444;
    const gridColor2 = isLightTheme ? 0xe8e8e8 : 0x2a2a2a;
    
    gridHelper = new THREE.GridHelper(1000, 20, gridColor1, gridColor2);
    gridHelper.position.y = 0;
    scene.add(gridHelper);
}

function setupEventListeners() {
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel);
    renderer.domElement.addEventListener('contextmenu', e => e.preventDefault());
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onWindowResize);
    
    document.getElementById('rect-tool').addEventListener('click', () => setTool('rectangle'));
    document.getElementById('line-tool').addEventListener('click', () => setTool('line'));
    document.getElementById('move-tool').addEventListener('click', () => setTool('move'));
    document.getElementById('width-input').addEventListener('input', onWidthChange);
    document.getElementById('height-input').addEventListener('input', onHeightChange);
    document.getElementById('depth-input').addEventListener('input', onDepthChange);
    document.getElementById('x-input').addEventListener('input', onXChange);
    document.getElementById('y-input').addEventListener('input', onYChange);
    document.getElementById('color-input').addEventListener('input', onColorChange);
    document.getElementById('line-width-input').addEventListener('input', onLineWidthChange);
    document.getElementById('measurements-toggle').addEventListener('change', onMeasurementToggle);
    document.getElementById('object-dimensions-toggle').addEventListener('change', onObjectDimensionsToggle);
    document.getElementById('distance-lines-toggle').addEventListener('change', onDistanceLinesToggle);
    document.getElementById('object-show-dimensions').addEventListener('change', onObjectShowDimensionsChange);
    document.getElementById('object-show-distances').addEventListener('change', onObjectShowDistancesChange);
    document.getElementById('clear-all').addEventListener('click', clearAll);
    document.getElementById('room-width').addEventListener('input', onRoomDimensionChange);
    document.getElementById('room-height').addEventListener('input', onRoomDimensionChange);
    document.getElementById('measurement-increase').addEventListener('click', increaseMeasurementSize);
    document.getElementById('measurement-decrease').addEventListener('click', decreaseMeasurementSize);
    document.getElementById('save-project').addEventListener('click', saveProject);
    document.getElementById('load-project').addEventListener('click', () => {
        document.getElementById('load-input').click();
    });
    document.getElementById('load-input').addEventListener('change', loadProject);
    document.getElementById('screenshot-btn').addEventListener('click', takeScreenshot);
    document.getElementById('light-theme-toggle').addEventListener('change', toggleTheme);
}

function setTool(tool) {
    currentTool = tool;
    document.getElementById('rect-tool').classList.toggle('active', tool === 'rectangle');
    document.getElementById('line-tool').classList.toggle('active', tool === 'line');
    document.getElementById('move-tool').classList.toggle('active', tool === 'move');
    
    if (tool === 'line') {
        document.getElementById('line-properties').classList.add('visible');
    } else {
        document.getElementById('line-properties').classList.remove('visible');
    }
    
    if (tool === 'move') {
        renderer.domElement.style.cursor = 'move';
    } else {
        renderer.domElement.style.cursor = 'default';
    }
}

function onMouseDown(event) {
    if (event.button === 1) {
        event.preventDefault();
        isRotating = true;
        lastMousePos = { x: event.clientX, y: event.clientY };
        return;
    }
    
    if (event.button === 2) {
        event.preventDefault();
        isPanning = true;
        lastMousePos = { x: event.clientX, y: event.clientY };
        renderer.domElement.style.cursor = 'grabbing';
        return;
    }
    
    if (event.button !== 0) return;
    
    updateMouse(event);
    raycaster.setFromCamera(mouse, camera);
    
    if (currentTool === 'line') {
        const cabinetIntersects = shapes.map(s => s.mesh).filter(m => m);
        const cabinetHits = raycaster.intersectObjects(cabinetIntersects, true);
        
        if (cabinetHits.length > 0) {
            const hitPoint = cabinetHits[0].point.clone();
            const hitObject = cabinetHits[0].object;
            const parentShape = shapes.find(s => s.mesh === hitObject.parent || s.mesh === hitObject);
            
            if (parentShape && parentShape.type === 'rectangle') {
                deselectShape();
                isDrawing = true;
                drawStart = hitPoint;
                drawStart.parentShape = parentShape;
                startDrawingLine(drawStart);
            }
            return;
        }
    }
    
    if (currentTool === 'rectangle') {
        const wallIntersects = raycaster.intersectObject(wall);
        if (wallIntersects.length > 0) {
            deselectShape();
            isDrawing = true;
            drawStart = wallIntersects[0].point.clone();
            startDrawingRectangle(drawStart);
        }
        return;
    }
    
    const shapeIntersects = shapes.map(s => s.mesh).filter(m => m);
    const intersects = raycaster.intersectObjects(shapeIntersects, true);
    
    if (intersects.length > 0) {
        let shape = null;
        const intersectedObject = intersects[0].object;
        
        shape = shapes.find(s => s.mesh === intersectedObject);
        
        if (!shape && intersectedObject.parent) {
            shape = shapes.find(s => s.mesh === intersectedObject.parent);
        }
        
        if (shape) {
            selectShape(shape);
            
            if (currentTool === 'move' && shape.type === 'rectangle') {
                isMoving = true;
                const { minX, maxX, minY, maxY } = shape.bounds;
                const centerX = (minX + maxX) / 2;
                const centerY = (minY + maxY) / 2;
                moveOffset = {
                    x: intersects[0].point.x - centerX,
                    y: intersects[0].point.y - centerY
                };
            }
        }
    }
}

function onMouseMove(event) {
    if (isRotating) {
        const deltaX = event.clientX - lastMousePos.x;
        const deltaY = event.clientY - lastMousePos.y;
        
        cameraRotation.y -= deltaX * 0.005;
        cameraRotation.x += deltaY * 0.005;
        cameraRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraRotation.x));
        
        updateCameraPosition();
        
        lastMousePos = { x: event.clientX, y: event.clientY };
        return;
    }
    
    if (isPanning) {
        const deltaX = event.clientX - lastMousePos.x;
        const deltaY = event.clientY - lastMousePos.y;
        
        const distance = camera.position.distanceTo(cameraTarget);
        const panSpeed = distance * 0.001;
        
        const right = new THREE.Vector3();
        const up = new THREE.Vector3(0, 1, 0);
        camera.getWorldDirection(right);
        right.cross(up).normalize();
        
        cameraTarget.addScaledVector(right, -deltaX * panSpeed);
        cameraTarget.y += deltaY * panSpeed;
        
        updateCameraPosition();
        
        lastMousePos = { x: event.clientX, y: event.clientY };
        return;
    }
    
    if (isMoving && selectedShape && moveOffset) {
        updateMouse(event);
        raycaster.setFromCamera(mouse, camera);
        const wallIntersects = raycaster.intersectObject(wall);
        
        if (wallIntersects.length > 0) {
            const point = wallIntersects[0].point;
            moveShape(selectedShape, point.x - moveOffset.x, point.y - moveOffset.y);
        }
        return;
    }
    
    if (isDrawing && tempShape) {
        updateMouse(event);
        raycaster.setFromCamera(mouse, camera);
        
        if (currentTool === 'rectangle') {
            const wallIntersects = raycaster.intersectObject(wall);
            if (wallIntersects.length > 0) {
                updateDrawingRectangle(wallIntersects[0].point);
            }
        } else if (currentTool === 'line' && drawStart && drawStart.parentShape) {
            const cabinetIntersects = shapes.map(s => s.mesh).filter(m => m);
            const cabinetHits = raycaster.intersectObjects(cabinetIntersects, true);
            
            if (cabinetHits.length > 0) {
                const hitObject = cabinetHits[0].object;
                const hitShape = shapes.find(s => s.mesh === hitObject.parent || s.mesh === hitObject);
                
                if (hitShape === drawStart.parentShape) {
                    updateDrawingLine(cabinetHits[0].point);
                }
            }
        }
    }
}

function onMouseUp(event) {
    if (event.button === 1) {
        isRotating = false;
        return;
    }
    
    if (event.button === 2) {
        isPanning = false;
        renderer.domElement.style.cursor = 'default';
        return;
    }
    
    if (isMoving) {
        isMoving = false;
        moveOffset = null;
        updateDistanceLines();
        return;
    }
    
    if (isDrawing && tempShape) {
        finishDrawing();
    }
    
    isDrawing = false;
}

function onWheel(event) {
    event.preventDefault();
    const delta = event.deltaY * 0.1;
    const distance = camera.position.distanceTo(cameraTarget);
    const newDistance = Math.max(100, Math.min(1000, distance + delta));
    
    const direction = new THREE.Vector3();
    direction.subVectors(camera.position, cameraTarget).normalize();
    camera.position.copy(cameraTarget).addScaledVector(direction, newDistance);
}

function onKeyDown(event) {
    if (event.key === 'Delete' && selectedShape) {
        if (selectedShape.type === 'line') {
            removeLine(selectedShape);
        } else {
            removeShape(selectedShape);
        }
    } else if (event.key === 'm' || event.key === 'M') {
        showMeasurements = !showMeasurements;
        document.getElementById('measurements-toggle').checked = showMeasurements;
        updateAllMeasurements();
    } else if (event.key === 'a' || event.key === 'A') {
        if (!isInputFocused()) setTool('rectangle');
    } else if (event.key === 's' || event.key === 'S') {
        if (!isInputFocused()) setTool('line');
    } else if (event.key === 'd' || event.key === 'D') {
        if (!isInputFocused()) setTool('move');
    } else if (event.key === 'ArrowLeft' && selectedShape && selectedShape.type === 'rectangle' && !isInputFocused()) {
        event.preventDefault();
        moveSelectedShapeByKey(-1, 0);
    } else if (event.key === 'ArrowRight' && selectedShape && selectedShape.type === 'rectangle' && !isInputFocused()) {
        event.preventDefault();
        moveSelectedShapeByKey(1, 0);
    } else if (event.key === 'ArrowUp' && selectedShape && selectedShape.type === 'rectangle' && !isInputFocused()) {
        event.preventDefault();
        moveSelectedShapeByKey(0, 1);
    } else if (event.key === 'ArrowDown' && selectedShape && selectedShape.type === 'rectangle' && !isInputFocused()) {
        event.preventDefault();
        moveSelectedShapeByKey(0, -1);
    }
}

function isInputFocused() {
    const activeElement = document.activeElement;
    return activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA');
}

function moveSelectedShapeByKey(deltaX, deltaY) {
    if (!selectedShape || selectedShape.type !== 'rectangle') return;
    
    const step = event && event.shiftKey ? 10 : 1;
    
    const { minX, maxX, minY, maxY } = selectedShape.bounds;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    const newCenterX = centerX + deltaX * step;
    const newCenterY = centerY + deltaY * step;
    
    moveShape(selectedShape, newCenterX, newCenterY);
    updateDistanceLines();
}

function startDrawingRectangle(start) {
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
        start.x, start.y, start.z,
        start.x, start.y, start.z,
        start.x, start.y, start.z,
        start.x, start.y, start.z,
        start.x, start.y, start.z
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    
    const material = new THREE.LineBasicMaterial({ color: 0x4CAF50, linewidth: 2 });
    const line = new THREE.Line(geometry, material);
    scene.add(line);
    
    tempShape = {
        type: 'rectangle',
        line: line,
        start: start
    };
}

function updateDrawingRectangle(end) {
    if (!tempShape || tempShape.type !== 'rectangle') return;
    
    const start = tempShape.start;
    const vertices = new Float32Array([
        start.x, start.y, start.z,
        end.x, start.y, start.z,
        end.x, end.y, start.z,
        start.x, end.y, start.z,
        start.x, start.y, start.z
    ]);
    
    tempShape.line.geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    tempShape.line.geometry.attributes.position.needsUpdate = true;
    tempShape.end = end;
}

function startDrawingLine(start) {
    const line = createThickLine(start, start, lineWidth, 0x000000);
    scene.add(line);
    
    tempShape = {
        type: 'line',
        line: line,
        start: start
    };
}

function updateDrawingLine(end) {
    if (!tempShape || tempShape.type !== 'line') return;
    
    const start = tempShape.start;
    let snappedEnd = end.clone();
    
    const dx = Math.abs(end.x - start.x);
    const dy = Math.abs(end.y - start.y);
    
    if (dx < 5 && dy > dx) {
        snappedEnd.x = start.x;
    } else if (dy < 5 && dx > dy) {
        snappedEnd.y = start.y;
    }
    
    scene.remove(tempShape.line);
    tempShape.line = createThickLine(start, snappedEnd, lineWidth, 0x000000);
    scene.add(tempShape.line);
    tempShape.end = snappedEnd;
}

function finishDrawing() {
    if (!tempShape || !tempShape.end) {
        if (tempShape && tempShape.line) {
            scene.remove(tempShape.line);
        }
        tempShape = null;
        return;
    }
    
    const minSize = 5;
    const dx = Math.abs(tempShape.end.x - tempShape.start.x);
    const dy = Math.abs(tempShape.end.y - tempShape.start.y);
    
    if (dx < minSize && dy < minSize) {
        scene.remove(tempShape.line);
        tempShape = null;
        return;
    }
    
    if (tempShape.type === 'rectangle') {
        createRectangleShape(tempShape.start, tempShape.end);
    } else if (tempShape.type === 'line') {
        createLineShape(tempShape.start, tempShape.end);
    }
    
    scene.remove(tempShape.line);
    tempShape = null;
}

function createRectangleShape(start, end) {
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);
    
    const width = maxX - minX;
    const height = maxY - minY;
    const depth = 60;
    
    const shape = {
        type: 'rectangle',
        bounds: { minX, maxX, minY, maxY },
        width: width,
        height: height,
        depth: depth,
        color: 0x8B4513,
        mesh: null,
        outline: null,
        measurements: [],
        showDimensions: true,
        showDistances: true
    };
    
    createRectangleMesh(shape);
    shapes.push(shape);
    selectShape(shape);
    updateDistanceLines();
}

function createRectangleMesh(shape) {
    if (shape.mesh) {
        scene.remove(shape.mesh);
    }
    
    const { minX, maxX, minY, maxY } = shape.bounds;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    const geometry = new THREE.BoxGeometry(shape.width, shape.height, shape.depth);
    const material = new THREE.MeshPhongMaterial({
        color: shape.color,
        transparent: true,
        opacity: 0.8
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(centerX, centerY, shape.depth / 2);
    
    const edges = new THREE.EdgesGeometry(geometry);
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 });
    const edgeLines = new THREE.LineSegments(edges, edgeMaterial);
    mesh.add(edgeLines);
    
    scene.add(mesh);
    shape.mesh = mesh;
    
    updateShapeMeasurements(shape);
}

function createLineShape(start, end) {
    if (!start.parentShape) return;
    
    const line = createThickLine(start, end, lineWidth, 0x000000);
    scene.add(line);
    
    const shape = {
        type: 'line',
        start: start,
        end: end,
        mesh: line,
        parentShape: start.parentShape,
        lineWidth: lineWidth,
        measurements: []
    };
    
    if (!start.parentShape.lines) {
        start.parentShape.lines = [];
    }
    start.parentShape.lines.push(shape);
    
    shapes.push(shape);
}

function createThickLine(start, end, width, color) {
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    
    const actualWidth = width * 0.1;
    
    if (length === 0) {
        const geometry = new THREE.PlaneGeometry(0.1, actualWidth);
        const material = new THREE.MeshBasicMaterial({ 
            color: color, 
            side: THREE.DoubleSide 
        });
        const mesh = new THREE.Mesh(geometry, material);
        const adjustedStart = start.clone();
        adjustedStart.z += 1;
        mesh.position.copy(adjustedStart);
        return mesh;
    }
    
    const geometry = new THREE.PlaneGeometry(length, actualWidth);
    const material = new THREE.MeshBasicMaterial({ 
        color: color, 
        side: THREE.DoubleSide 
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    
    const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    midpoint.z += 1;
    mesh.position.copy(midpoint);
    
    const angle = Math.atan2(direction.y, direction.x);
    mesh.rotation.z = angle;
    
    return mesh;
}

function updateShapeMeasurements(shape) {
    shape.measurements.forEach(m => scene.remove(m));
    shape.measurements = [];
    
    if (!showMeasurements || !showObjectDimensions || shape.type !== 'rectangle') return;
    if (shape.showDimensions === false) return;
    
    const { minX, maxX, minY, maxY } = shape.bounds;
    const depth = shape.depth;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    const measurementText = `${shape.width.toFixed(0)} × ${shape.height.toFixed(0)} × ${depth.toFixed(0)} cm`;
    const label = createTextSprite(measurementText, measurementScale);
    label.position.set(centerX, centerY, depth + 10);
    scene.add(label);
    shape.measurements.push(label);
}

function createTextSprite(text, scale = 1) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 128;
    
    const bgColor = isLightTheme ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.7)';
    const textColor = isLightTheme ? '#333333' : 'white';
    
    context.fillStyle = bgColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.font = 'Bold 48px Arial';
    context.fillStyle = textColor;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(80 * scale, 20 * scale, 1);
    
    return sprite;
}

function selectShape(shapeOrMesh) {
    deselectShape();
    
    let shape = shapeOrMesh;
    if (shapeOrMesh instanceof THREE.Mesh) {
        shape = shapes.find(s => s.mesh === shapeOrMesh);
    }
    
    if (!shape) return;
    
    selectedShape = shape;
    
    if (shape.type === 'rectangle' && shape.mesh) {
        shape.mesh.material.emissive = new THREE.Color(0x224422);
    } else if (shape.type === 'line' && shape.mesh) {
        shape.originalColor = shape.mesh.material.color.getHex();
        shape.mesh.material.color.setHex(0x00FF00);
    }
    
    if (shape.type !== 'rectangle') return;
    
    const { minX, maxX, minY, maxY } = shape.bounds;
    
    const wallHalfWidth = roomWidth / 2;
    const xFromLeft = minX + wallHalfWidth;
    const yFromBottom = minY;
    
    document.getElementById('shape-properties').classList.add('visible');
    document.getElementById('width-input').value = shape.width.toFixed(1);
    document.getElementById('height-input').value = shape.height.toFixed(1);
    document.getElementById('depth-input').value = shape.depth.toFixed(1);
    document.getElementById('x-input').value = xFromLeft.toFixed(1);
    document.getElementById('y-input').value = yFromBottom.toFixed(1);
    document.getElementById('color-input').value = '#' + shape.color.toString(16).padStart(6, '0');
    document.getElementById('object-show-dimensions').checked = shape.showDimensions !== false;
    document.getElementById('object-show-distances').checked = shape.showDistances !== false;
}

function deselectShape() {
    if (selectedShape && selectedShape.mesh) {
        if (selectedShape.type === 'rectangle') {
            selectedShape.mesh.material.emissive = new THREE.Color(0x000000);
        } else if (selectedShape.type === 'line' && selectedShape.originalColor !== undefined) {
            selectedShape.mesh.material.color.setHex(selectedShape.originalColor);
        }
    }
    
    selectedShape = null;
    document.getElementById('shape-properties').classList.remove('visible');
}

function onWidthChange(event) {
    if (!selectedShape || selectedShape.type !== 'rectangle') return;
    
    const newWidth = parseFloat(event.target.value);
    if (isNaN(newWidth) || newWidth < 5) return;
    
    const { minX, maxX, minY, maxY } = selectedShape.bounds;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    selectedShape.width = newWidth;
    selectedShape.bounds.minX = centerX - newWidth / 2;
    selectedShape.bounds.maxX = centerX + newWidth / 2;
    
    constrainShapeToBounds(selectedShape);
    createRectangleMesh(selectedShape);
    updateSelectionHighlight();
    updateDistanceLines();
}

function onHeightChange(event) {
    if (!selectedShape || selectedShape.type !== 'rectangle') return;
    
    const newHeight = parseFloat(event.target.value);
    if (isNaN(newHeight) || newHeight < 5) return;
    
    const { minX, maxX, minY, maxY } = selectedShape.bounds;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    selectedShape.height = newHeight;
    selectedShape.bounds.minY = centerY - newHeight / 2;
    selectedShape.bounds.maxY = centerY + newHeight / 2;
    
    constrainShapeToBounds(selectedShape);
    createRectangleMesh(selectedShape);
    updateSelectionHighlight();
    updateDistanceLines();
}

function onDepthChange(event) {
    if (!selectedShape || selectedShape.type !== 'rectangle') return;
    
    const newDepth = parseFloat(event.target.value);
    if (isNaN(newDepth) || newDepth < 10) return;
    
    selectedShape.depth = newDepth;
    createRectangleMesh(selectedShape);
    updateSelectionHighlight();
    updateDistanceLines();
}

function onXChange(event) {
    if (!selectedShape || selectedShape.type !== 'rectangle') return;
    
    const xFromLeft = parseFloat(event.target.value);
    if (isNaN(xFromLeft)) return;
    
    const wallHalfWidth = roomWidth / 2;
    let minX = Math.round(xFromLeft - wallHalfWidth);
    let maxX = minX + selectedShape.width;
    
    if (checkCollision(selectedShape, minX, maxX, selectedShape.bounds.minY, selectedShape.bounds.maxY)) {
        document.getElementById('x-input').value = (selectedShape.bounds.minX + wallHalfWidth).toFixed(1);
        return;
    }
    
    selectedShape.bounds.minX = minX;
    selectedShape.bounds.maxX = maxX;
    
    constrainShapeToBounds(selectedShape);
    
    if (selectedShape.mesh) {
        const actualCenterX = (selectedShape.bounds.minX + selectedShape.bounds.maxX) / 2;
        const centerY = (selectedShape.bounds.minY + selectedShape.bounds.maxY) / 2;
        selectedShape.mesh.position.set(actualCenterX, centerY, selectedShape.depth / 2);
    }
    
    updateShapeMeasurements(selectedShape);
    updateDistanceLines();
    
    document.getElementById('x-input').value = (selectedShape.bounds.minX + wallHalfWidth).toFixed(1);
}

function onYChange(event) {
    if (!selectedShape || selectedShape.type !== 'rectangle') return;
    
    const yFromBottom = parseFloat(event.target.value);
    if (isNaN(yFromBottom)) return;
    
    let minY = Math.round(yFromBottom);
    let maxY = minY + selectedShape.height;
    
    if (checkCollision(selectedShape, selectedShape.bounds.minX, selectedShape.bounds.maxX, minY, maxY)) {
        document.getElementById('y-input').value = selectedShape.bounds.minY.toFixed(1);
        return;
    }
    
    selectedShape.bounds.minY = minY;
    selectedShape.bounds.maxY = maxY;
    
    constrainShapeToBounds(selectedShape);
    
    if (selectedShape.mesh) {
        const centerX = (selectedShape.bounds.minX + selectedShape.bounds.maxX) / 2;
        const actualCenterY = (selectedShape.bounds.minY + selectedShape.bounds.maxY) / 2;
        selectedShape.mesh.position.set(centerX, actualCenterY, selectedShape.depth / 2);
    }
    
    updateShapeMeasurements(selectedShape);
    updateDistanceLines();
    
    document.getElementById('y-input').value = selectedShape.bounds.minY.toFixed(1);
}

function updateSelectionHighlight() {
    if (selectedShape && selectedShape.mesh) {
        selectedShape.mesh.material.emissive = new THREE.Color(0x224422);
    }
}

function constrainShapeToBounds(shape) {
    const wallHalfWidth = roomWidth / 2;
    
    if (shape.bounds.minX < -wallHalfWidth) {
        const offset = -wallHalfWidth - shape.bounds.minX;
        shape.bounds.minX += offset;
        shape.bounds.maxX += offset;
    }
    if (shape.bounds.maxX > wallHalfWidth) {
        const offset = wallHalfWidth - shape.bounds.maxX;
        shape.bounds.minX += offset;
        shape.bounds.maxX += offset;
    }
    if (shape.bounds.minY < 0) {
        const offset = 0 - shape.bounds.minY;
        shape.bounds.minY += offset;
        shape.bounds.maxY += offset;
    }
    if (shape.bounds.maxY > roomHeight) {
        const offset = roomHeight - shape.bounds.maxY;
        shape.bounds.minY += offset;
        shape.bounds.maxY += offset;
    }
}

function onMeasurementToggle(event) {
    showMeasurements = event.target.checked;
    updateAllMeasurements();
    updateDistanceLines();
}

function onObjectDimensionsToggle(event) {
    showObjectDimensions = event.target.checked;
    updateAllMeasurements();
}

function onDistanceLinesToggle(event) {
    showDistanceLines = event.target.checked;
    updateDistanceLines();
}

function onObjectShowDimensionsChange(event) {
    if (!selectedShape || selectedShape.type !== 'rectangle') return;
    selectedShape.showDimensions = event.target.checked;
    updateShapeMeasurements(selectedShape);
}

function onObjectShowDistancesChange(event) {
    if (!selectedShape || selectedShape.type !== 'rectangle') return;
    selectedShape.showDistances = event.target.checked;
    updateDistanceLines();
}

function updateAllMeasurements() {
    shapes.forEach(shape => {
        if (shape.type === 'rectangle') {
            updateShapeMeasurements(shape);
        }
    });
}

function removeShape(shape) {
    if (shape.mesh) {
        scene.remove(shape.mesh);
    }
    
    shape.measurements.forEach(m => scene.remove(m));
    
    if (shape.lines) {
        shape.lines.forEach(line => {
            if (line.mesh) {
                scene.remove(line.mesh);
            }
            const lineIndex = shapes.indexOf(line);
            if (lineIndex > -1) {
                shapes.splice(lineIndex, 1);
            }
        });
    }
    
    const index = shapes.indexOf(shape);
    if (index > -1) {
        shapes.splice(index, 1);
    }
    
    if (selectedShape === shape) {
        deselectShape();
    }
    
    updateDistanceLines();
}

function clearAll() {
    if (shapes.length === 0) return;
    
    const confirmed = confirm('Are you sure you want to clear all cabinets and lines? This action cannot be undone.');
    
    if (!confirmed) return;
    
    while (shapes.length > 0) {
        removeShape(shapes[0]);
    }
    updateDistanceLines();
}

function increaseMeasurementSize() {
    measurementScale = Math.min(measurementScale + 0.1, 2.0);
    updateAllMeasurements();
}

function decreaseMeasurementSize() {
    measurementScale = Math.max(measurementScale - 0.1, 0.2);
    updateAllMeasurements();
}

function onColorChange(event) {
    if (!selectedShape || selectedShape.type !== 'rectangle') return;
    
    const colorHex = event.target.value;
    const colorInt = parseInt(colorHex.substring(1), 16);
    
    selectedShape.color = colorInt;
    
    if (selectedShape.mesh && selectedShape.mesh.material) {
        selectedShape.mesh.material.color.setHex(colorInt);
    }
}

function onLineWidthChange(event) {
    const newWidth = parseInt(event.target.value);
    if (!isNaN(newWidth) && newWidth >= 1 && newWidth <= 10) {
        lineWidth = newWidth;
    }
}

function removeLine(lineShape) {
    if (lineShape.mesh) {
        scene.remove(lineShape.mesh);
    }
    
    if (lineShape.parentShape && lineShape.parentShape.lines) {
        const index = lineShape.parentShape.lines.indexOf(lineShape);
        if (index > -1) {
            lineShape.parentShape.lines.splice(index, 1);
        }
    }
    
    const shapeIndex = shapes.indexOf(lineShape);
    if (shapeIndex > -1) {
        shapes.splice(shapeIndex, 1);
    }
    
    if (selectedShape === lineShape) {
        deselectShape();
    }
}

function snapToObjects(movingShape, minX, maxX, minY, maxY) {
    const snapDistance = 2;
    let snappedMinX = minX;
    let snappedMaxX = maxX;
    let snappedMinY = minY;
    let snappedMaxY = maxY;
    
    const rectangles = shapes.filter(s => s.type === 'rectangle' && s !== movingShape);
    
    for (const other of rectangles) {
        if (Math.abs(minY - other.bounds.maxY) < snapDistance || Math.abs(maxY - other.bounds.minY) < snapDistance) {
            if (Math.abs(maxX - other.bounds.minX) < snapDistance) {
                snappedMaxX = other.bounds.minX;
                snappedMinX = snappedMaxX - movingShape.width;
            }
            else if (Math.abs(minX - other.bounds.maxX) < snapDistance) {
                snappedMinX = other.bounds.maxX;
                snappedMaxX = snappedMinX + movingShape.width;
            }
        }
        
        if (Math.abs(minX - other.bounds.maxX) < snapDistance || Math.abs(maxX - other.bounds.minX) < snapDistance) {
            if (Math.abs(maxY - other.bounds.minY) < snapDistance) {
                snappedMaxY = other.bounds.minY;
                snappedMinY = snappedMaxY - movingShape.height;
            }
            else if (Math.abs(minY - other.bounds.maxY) < snapDistance) {
                snappedMinY = other.bounds.maxY;
                snappedMaxY = snappedMinY + movingShape.height;
            }
        }
    }
    
    return { minX: snappedMinX, maxX: snappedMaxX, minY: snappedMinY, maxY: snappedMaxY };
}

function checkCollision(movingShape, minX, maxX, minY, maxY) {
    const rectangles = shapes.filter(s => s.type === 'rectangle' && s !== movingShape);
    
    for (const other of rectangles) {
        if (!(maxX <= other.bounds.minX || 
              minX >= other.bounds.maxX || 
              maxY <= other.bounds.minY || 
              minY >= other.bounds.maxY)) {
            return true;
        }
    }
    
    return false;
}

function saveProject() {
    const projectData = {
        version: '1.0',
        roomWidth: roomWidth,
        roomHeight: roomHeight,
        cameraTarget: {
            x: cameraTarget.x,
            y: cameraTarget.y,
            z: cameraTarget.z
        },
        cameraRotation: {
            x: cameraRotation.x,
            y: cameraRotation.y
        },
        shapes: shapes.map(shape => {
            if (shape.type === 'rectangle') {
                return {
                    type: 'rectangle',
                    bounds: shape.bounds,
                    width: shape.width,
                    height: shape.height,
                    depth: shape.depth,
                    color: shape.color
                };
            } else if (shape.type === 'line') {
                return {
                    type: 'line',
                    start: { x: shape.start.x, y: shape.start.y, z: shape.start.z },
                    end: { x: shape.end.x, y: shape.end.y, z: shape.end.z }
                };
            }
            return null;
        }).filter(s => s !== null)
    };
    
    const json = JSON.stringify(projectData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    a.download = `cabinet-project-${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('Project saved successfully');
}

function loadProject(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const projectData = JSON.parse(e.target.result);
            
            clearAll();
            
            if (projectData.roomWidth) {
                roomWidth = projectData.roomWidth;
                document.getElementById('room-width').value = roomWidth;
            }
            if (projectData.roomHeight) {
                roomHeight = projectData.roomHeight;
                document.getElementById('room-height').value = roomHeight;
            }
            
            createWall();
            
            if (projectData.cameraTarget) {
                cameraTarget.set(
                    projectData.cameraTarget.x,
                    projectData.cameraTarget.y,
                    projectData.cameraTarget.z
                );
            }
            
            if (projectData.cameraRotation) {
                cameraRotation.x = projectData.cameraRotation.x;
                cameraRotation.y = projectData.cameraRotation.y;
                updateCameraPosition();
            }
            
            if (projectData.shapes && Array.isArray(projectData.shapes)) {
                projectData.shapes.forEach(shapeData => {
                    if (shapeData.type === 'rectangle') {
                        const shape = {
                            type: 'rectangle',
                            bounds: shapeData.bounds,
                            width: shapeData.width,
                            height: shapeData.height,
                            depth: shapeData.depth,
                            color: shapeData.color || 0x8B4513,
                            mesh: null,
                            outline: null,
                            measurements: [],
                            showDimensions: shapeData.showDimensions !== false,
                            showDistances: shapeData.showDistances !== false
                        };
                        createRectangleMesh(shape);
                        shapes.push(shape);
                    } else if (shapeData.type === 'line') {
                        const start = new THREE.Vector3(
                            shapeData.start.x,
                            shapeData.start.y,
                            shapeData.start.z
                        );
                        const end = new THREE.Vector3(
                            shapeData.end.x,
                            shapeData.end.y,
                            shapeData.end.z
                        );
                        
                        const width = lineData.lineWidth || 2;
                        const line = createThickLine(start, end, width, 0x000000);
                        scene.add(line);
                        
                        const shape = {
                            type: 'line',
                            start: start,
                            end: end,
                            mesh: line,
                            lineWidth: width,
                            measurements: []
                        };
                        
                        shapes.push(shape);
                    }
                });
            }
            
            updateDistanceLines();
            
            console.log('Project loaded successfully');
        } catch (error) {
            console.error('Error loading project:', error);
            alert('Error loading project file. Please make sure it is a valid cabinet project file.');
        }
    };
    
    reader.readAsText(file);
    event.target.value = '';
}

function takeScreenshot() {
    try {
        renderer.render(scene, camera);
        
        const canvas = renderer.domElement;
        
        canvas.toBlob(function(blob) {
            if (!blob) {
                alert('Failed to create screenshot. Please try again.');
                return;
            }
            
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            link.download = `cabinet-screenshot-${timestamp}.png`;
            link.href = url;
            link.click();
            
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 100);
        }, 'image/png');
        
        console.log('Screenshot captured');
    } catch (error) {
        console.error('Error taking screenshot:', error);
        alert('Failed to take screenshot. Please try again.');
    }
}

function toggleTheme(event) {
    isLightTheme = event.target.checked;
    
    const backgroundColor = isLightTheme ? 0xffffff : 0x1a1a1a;
    scene.background = new THREE.Color(backgroundColor);
    
    createWall();
    createGrid();
    
    updateAllMeasurements();
    updateDistanceLines();
}

function moveShape(shape, newCenterX, newCenterY) {
    if (!shape || shape.type !== 'rectangle') return;
    
    const halfWidth = shape.width / 2;
    const halfHeight = shape.height / 2;
    const wallHalfWidth = roomWidth / 2;
    
    newCenterX = Math.max(-wallHalfWidth + halfWidth, Math.min(wallHalfWidth - halfWidth, newCenterX));
    newCenterY = Math.max(0 + halfHeight, Math.min(roomHeight - halfHeight, newCenterY));
    
    let proposedMinX = newCenterX - halfWidth;
    let proposedMaxX = newCenterX + halfWidth;
    let proposedMinY = newCenterY - halfHeight;
    let proposedMaxY = newCenterY + halfHeight;
    
    proposedMinX = Math.round(proposedMinX);
    proposedMaxX = Math.round(proposedMaxX);
    proposedMinY = Math.round(proposedMinY);
    proposedMaxY = Math.round(proposedMaxY);
    
    const snapResult = snapToObjects(shape, proposedMinX, proposedMaxX, proposedMinY, proposedMaxY);
    proposedMinX = snapResult.minX;
    proposedMaxX = snapResult.maxX;
    proposedMinY = snapResult.minY;
    proposedMaxY = snapResult.maxY;
    
    if (checkCollision(shape, proposedMinX, proposedMaxX, proposedMinY, proposedMaxY)) {
        return;
    }
    
    shape.bounds.minX = proposedMinX;
    shape.bounds.maxX = proposedMaxX;
    shape.bounds.minY = proposedMinY;
    shape.bounds.maxY = proposedMaxY;
    
    const finalCenterX = (proposedMinX + proposedMaxX) / 2;
    const finalCenterY = (proposedMinY + proposedMaxY) / 2;
    
    if (shape.mesh) {
        shape.mesh.position.set(finalCenterX, finalCenterY, shape.depth / 2);
    }
    
    updateShapeMeasurements(shape);
    
    if (selectedShape === shape) {
        const wallHalfWidth = roomWidth / 2;
        document.getElementById('x-input').value = (shape.bounds.minX + wallHalfWidth).toFixed(1);
        document.getElementById('y-input').value = shape.bounds.minY.toFixed(1);
    }
}

function onRoomDimensionChange() {
    const newWidth = parseFloat(document.getElementById('room-width').value);
    const newHeight = parseFloat(document.getElementById('room-height').value);
    
    if (!isNaN(newWidth) && newWidth >= 100) {
        roomWidth = newWidth;
    }
    if (!isNaN(newHeight) && newHeight >= 100) {
        roomHeight = newHeight;
    }
    
    createWall();
    updateDistanceLines();
}

function updateDistanceLines() {
    distanceLines.forEach(line => scene.remove(line));
    distanceLines = [];
    
    if (!showMeasurements || !showDistanceLines) return;
    
    const rectangles = shapes.filter(s => s.type === 'rectangle' && s.showDistances !== false);
    
    rectangles.forEach(shape => {
        const { minX, maxX, minY, maxY } = shape.bounds;
        const wallHalfWidth = roomWidth / 2;
        
        const leftDist = minX - (-wallHalfWidth);
        const rightDist = wallHalfWidth - maxX;
        const bottomDist = minY - 0;
        const topDist = roomHeight - maxY;
        
        if (leftDist > 1) {
            const line = createDimensionLine(
                new THREE.Vector3(-wallHalfWidth, (minY + maxY) / 2, 0),
                new THREE.Vector3(minX, (minY + maxY) / 2, 0),
                leftDist
            );
            distanceLines.push(...line);
        }
        
        if (rightDist > 1) {
            const line = createDimensionLine(
                new THREE.Vector3(maxX, (minY + maxY) / 2, 0),
                new THREE.Vector3(wallHalfWidth, (minY + maxY) / 2, 0),
                rightDist
            );
            distanceLines.push(...line);
        }
        
        if (bottomDist > 1) {
            const line = createDimensionLine(
                new THREE.Vector3((minX + maxX) / 2, 0, 0),
                new THREE.Vector3((minX + maxX) / 2, minY, 0),
                bottomDist
            );
            distanceLines.push(...line);
        }
        
        if (topDist > 1) {
            const line = createDimensionLine(
                new THREE.Vector3((minX + maxX) / 2, maxY, 0),
                new THREE.Vector3((minX + maxX) / 2, roomHeight, 0),
                topDist
            );
            distanceLines.push(...line);
        }
    });
    
    for (let i = 0; i < rectangles.length; i++) {
        for (let j = i + 1; j < rectangles.length; j++) {
            const shape1 = rectangles[i];
            const shape2 = rectangles[j];
            
            const horizontalGap = Math.max(0, 
                Math.max(shape1.bounds.minX, shape2.bounds.minX) - 
                Math.min(shape1.bounds.maxX, shape2.bounds.maxX)
            );
            
            const verticalGap = Math.max(0,
                Math.max(shape1.bounds.minY, shape2.bounds.minY) - 
                Math.min(shape1.bounds.maxY, shape2.bounds.maxY)
            );
            
            if (horizontalGap > 1 && verticalGap === 0) {
                const y = (Math.max(shape1.bounds.minY, shape2.bounds.minY) + 
                          Math.min(shape1.bounds.maxY, shape2.bounds.maxY)) / 2;
                const x1 = Math.min(shape1.bounds.maxX, shape2.bounds.maxX);
                const x2 = Math.max(shape1.bounds.minX, shape2.bounds.minX);
                
                const line = createDimensionLine(
                    new THREE.Vector3(x1, y, 0),
                    new THREE.Vector3(x2, y, 0),
                    horizontalGap
                );
                distanceLines.push(...line);
            }
            
            if (verticalGap > 1 && horizontalGap === 0) {
                const x = (Math.max(shape1.bounds.minX, shape2.bounds.minX) + 
                          Math.min(shape1.bounds.maxX, shape2.bounds.maxX)) / 2;
                const y1 = Math.min(shape1.bounds.maxY, shape2.bounds.maxY);
                const y2 = Math.max(shape1.bounds.minY, shape2.bounds.minY);
                
                const line = createDimensionLine(
                    new THREE.Vector3(x, y1, 0),
                    new THREE.Vector3(x, y2, 0),
                    verticalGap
                );
                distanceLines.push(...line);
            }
        }
    }
}

function createDimensionLine(start, end, distance) {
    const objects = [];
    
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
        start.x, start.y, start.z,
        end.x, end.y, end.z
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    
    const lineColor = isLightTheme ? 0x0099cc : 0x00ffff;
    const lineOpacity = isLightTheme ? 0.8 : 0.6;
    
    const material = new THREE.LineBasicMaterial({ 
        color: lineColor, 
        linewidth: 1,
        transparent: true,
        opacity: lineOpacity
    });
    const line = new THREE.Line(geometry, material);
    scene.add(line);
    objects.push(line);
    
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const midZ = (start.z + end.z) / 2;
    
    const label = createTextSprite(`${distance.toFixed(1)} cm`, 0.4);
    label.position.set(midX, midY, midZ + 5);
    scene.add(label);
    objects.push(label);
    
    return objects;
}

function updateCameraPosition() {
    const distance = camera.position.distanceTo(cameraTarget);
    const x = cameraTarget.x + distance * Math.sin(cameraRotation.y) * Math.cos(cameraRotation.x);
    const y = cameraTarget.y + distance * Math.sin(cameraRotation.x);
    const z = cameraTarget.z + distance * Math.cos(cameraRotation.y) * Math.cos(cameraRotation.x);
    
    camera.position.set(x, y, z);
    camera.lookAt(cameraTarget);
}

function updateMouse(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

function initCollapsibleSections() {
    const headers = document.querySelectorAll('.section-header');
    
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            const isCollapsed = header.classList.contains('collapsed');
            
            if (isCollapsed) {
                header.classList.remove('collapsed');
                content.classList.remove('collapsed');
            } else {
                header.classList.add('collapsed');
                content.classList.add('collapsed');
            }
        });
    });
}
