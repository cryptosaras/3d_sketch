# 3D Cabinet Sketcher

A lightweight, browser-based 3D cabinet design tool that runs entirely in your browser. No installation, no dependencies, no server required - just download and open!

![3D Cabinet Sketcher](https://img.shields.io/badge/three.js-r128-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![No Dependencies](https://img.shields.io/badge/dependencies-none-brightgreen)

## ✨ Features

- **🎨 Simple & Intuitive** - Draw rectangles and lines to design your cabinet layout
- **📐 Precise Measurements** - Real-time dimensions in centimeters
- **🔄 3D Visualization** - Fully interactive 3D view with rotation, pan, and zoom
- **💾 Save & Load** - Export and import your projects as JSON
- **📸 Screenshot Export** - Capture your designs as images
- **🎯 Smart Tools** - Rectangle tool, Line tool, and Move tool with keyboard shortcuts
- **📏 Distance Calculations** - Automatic distance measurements between objects
- **🌓 Light/Dark Theme** - Print-friendly light theme available
- **⚡ Zero Installation** - Runs completely in your browser using Three.js

## 🚀 Quick Start

### Method 1: Download and Run (Recommended)

1. **Download** - Click the green "Code" button above and select "Download ZIP"
2. **Extract** - Unzip the downloaded file to any folder on your computer
3. **Run** - Simply double-click `index.html` to open in your default browser
4. **Start Designing!** - That's it! No installation needed.

### Method 2: Clone Repository

```bash
git clone https://github.com/cryptosaras/3d_sketch.git
cd 3d_sketch
# Open index.html in your browser
```

## 🎮 How to Use

### Mouse Controls

- **Left Drag** - Draw shapes or move selected objects
- **Right Drag** - Pan the camera
- **Middle Drag** - Rotate the view
- **Scroll Wheel** - Zoom in/out

### Keyboard Shortcuts

- **A** - Rectangle tool
- **S** - Line tool
- **D** - Move tool
- **M** - Toggle measurements
- **Arrow Keys** - Move selected object (Hold Shift for faster movement)
- **Delete** - Remove selected object

### Tools

1. **Rectangle Tool (A)** - Draw 3D cabinet boxes
   - Click and drag to create a rectangle
   - Adjust width, height, and depth in the properties panel
   - Change color and position

2. **Line Tool (S)** - Draw guide lines
   - Click and drag to create lines
   - Adjust line width in properties

3. **Move Tool (D)** - Reposition objects
   - Click and drag to move selected items
   - Fine-tune position using arrow keys or input fields

### Workflow

1. Set your room dimensions in the "Room Settings" panel
2. Select a tool (Rectangle or Line)
3. Click and drag on the wall to draw
4. Click on any object to select and modify its properties
5. Use measurements to ensure accurate spacing
6. Save your project for later or export a screenshot

## 📋 Project Files

- `index.html` - Main application file (open this to run)
- `app.js` - Application logic and Three.js implementation
- `README.md` - This file

## 🔧 Technical Details

- **Framework**: Three.js r128 (loaded via CDN)
- **No Build Process** - Pure HTML, CSS, and JavaScript
- **Browser Compatibility** - Works in all modern browsers (Chrome, Firefox, Safari, Edge)
- **File Size** - < 100KB total (excluding Three.js CDN)

## 💡 Use Cases

- Kitchen cabinet planning
- Garage storage layout
- Office furniture arrangement
- Closet organization
- Workshop tool storage
- Any wall-mounted cabinet design

## 🎨 Features in Detail

### Real-Time Measurements
- Object dimensions (width, height, depth)
- Distance from room edges
- Distance between objects
- Adjustable measurement label size

### Customization
- Custom room dimensions (100-2000cm width, 100-500cm height)
- Individual cabinet colors
- Adjustable cabinet depth (10-200cm)
- Show/hide measurements per object

### Project Management
- Save projects as JSON files
- Load previously saved projects
- Export screenshots of your design
- Light theme for printing

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## 📝 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Built with [Three.js](https://threejs.org/) - JavaScript 3D library
- Inspired by the need for simple, accessible cabinet planning tools

## 📞 Support

If you encounter any issues or have questions:
1. Check the keyboard shortcuts in the app (collapsed section at bottom)
2. Open an issue on GitHub
3. Make sure you're using a modern browser with WebGL support

---

**Made with ❤️ for DIY enthusiasts and cabinet makers**

*No installation, no hassle - just open and design!*

