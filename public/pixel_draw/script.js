class PixelArt {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridOverlay = document.querySelector('.grid-overlay');
        this.colorCategories = document.querySelector('.color-categories');
        this.customPalette = document.getElementById('customColors');
        this.colorInfo = document.getElementById('colorInfo');
        this.searchInput = document.getElementById('colorSearch');
        this.toggleLibraryBtn = document.getElementById('toggleLibrary');
        this.canvasScale = document.getElementById('canvasScale');
        this.scaleValue = document.getElementById('scaleValue');
        
        this.currentTool = 'pencil';
        this.currentColor = null;
        this.isDrawing = false;
        this.history = [];
        this.historyIndex = -1;
        this.maxHistory = 10;
        this.scale = 2;
        this.basePixelSize = 20;
        
        // 色库数据
        this.colorLibrary = {
            "ZG1": "#DAABB3", "B16": "#C0ED9C", "D4": "#182A84", "F3": "#EF4D3E", "H6": "#2C2C2C", "P17": "#FEA324",
            "ZG2": "#D6AA87", "B17": "#9EB33E", "D5": "#B843C5", "F4": "#F92B40", "H7": "#010101", "P18": "#FEB89F",
            "ZG3": "#C1BD8D", "B18": "#E6ED4F", "D6": "#B37BDC", "F5": "#E30328", "H8": "#E7D6DC", "P19": "#FFFEEC",
            "ZG4": "#96869F", "B19": "#26B78E", "D7": "#8758A9", "F6": "#913635", "H9": "#EFEDEE", "P20": "#FEBECF",
            "ZG5": "#8490A6", "B20": "#CAEDCF", "D8": "#E3D2FE", "F7": "#911932", "H10": "#ECEAEB", "P21": "#ECBEBF",
            "ZG6": "#94BFE2", "B21": "#176268", "D9": "#D6BAF5", "F8": "#BB0126", "H11": "#CDCDCD", "P22": "#E4A89F",
            "ZG7": "#E2A9D2", "B22": "#0A4241", "D10": "#301A49", "F9": "#E0677A", "H12": "#FDF6EE", "P23": "#A56268",
            "ZG8": "#AB91C0", "B23": "#343B1A", "D11": "#BCBAE2", "F10": "#874628", "H13": "#F4EFD1", "Q1": "#F2A5E8",
            "A1": "#FAF5CD", "B24": "#E8FAA6", "D12": "#DC99CE", "F11": "#592323", "H14": "#CED7D4", "Q2": "#E9EC91",
            "A2": "#FCFED6", "B25": "#4E846D", "D13": "#B5038F", "F12": "#F8516D", "H15": "#98A6A6", "Q3": "#FFFF00",
            "A3": "#FCFF92", "B26": "#907C35", "D14": "#882893", "F13": "#F45C45", "H16": "#1B1213", "Q4": "#FFEBFA",
            "A4": "#F7EC5C", "B27": "#D0E0AF", "D15": "#2F1E8E", "F14": "#FCADB2", "H17": "#F0EEEF", "Q5": "#76CEDE",
            "A5": "#F0D83A", "B28": "#9EE5BB", "D16": "#E2E4F0", "F15": "#D50527", "H18": "#FCFFF8", "R1": "#D50D21",
            "A6": "#FDA951", "B29": "#C6DF5F", "D17": "#C7D3F9", "F16": "#F8C0A9", "H19": "#F2EEE5", "R2": "#F92F83",
            "A7": "#FA8C4F", "B30": "#E3FBB1", "D18": "#9A64B8", "F17": "#E89B7D", "H20": "#96A09F", "R3": "#FD8324",
            "A8": "#FDD94D", "B31": "#B2E694", "D19": "#D8C2D9", "F18": "#D07E4A", "H21": "#F8FBE6", "R4": "#F8EC31",
            "A9": "#F99C5F", "B32": "#92AD60", "D20": "#9C34AD", "F19": "#BE454A", "H22": "#CACAD2", "R5": "#35C75B",
            "A10": "#F47E36", "C1": "#F0FEE4", "D21": "#940595", "F20": "#C69495", "H23": "#9B9C94", "R6": "#238891",
            "A11": "#FEDB99", "C2": "#ABF8FE", "D22": "#383995", "F21": "#F2B8C6", "M1": "#BBC6B6", "R7": "#19779D",
            "A12": "#FDA276", "C3": "#9EE0F8", "D23": "#EADBF8", "F22": "#F7C3D0", "M2": "#909994", "R8": "#1A60C3",
            "A13": "#FEC667", "C4": "#44CDFB", "D24": "#768AE1", "F23": "#EC806D", "M3": "#697E80", "R9": "#9A56B4",
            "A14": "#E85842", "C5": "#06ABE3", "D25": "#4950C2", "F24": "#E09DAF", "M4": "#E0D4BC", "R10": "#FFDB4C",
            "A15": "#FBF65E", "C6": "#54A7E9", "D26": "#D6C6EB", "F25": "#E84854", "M5": "#D0CBAE", "R11": "#FFEBFA",
            "A16": "#FEFF97", "C7": "#3977CC", "E1": "#F6D4CB", "G1": "#FFE4D3", "M6": "#B0AA86", "R12": "#D8D5CE",
            "A17": "#FDE173", "C8": "#0F52BD", "E2": "#FCC1DD", "G2": "#FCC6AC", "M7": "#B0A796", "R13": "#55514C",
            "A18": "#FCBF80", "C9": "#3349C3", "E3": "#F6BDE8", "G3": "#F1C4A5", "M8": "#AE8082", "R14": "#9FE4DF",
            "A19": "#FD7E77", "C10": "#3DBBE3", "E4": "#E9639E", "G4": "#DCB387", "M9": "#A88764", "R15": "#77CEE9",
            "A20": "#F9D66E", "C11": "#2ADED3", "E5": "#F1559F", "G5": "#E7B34E", "M10": "#C6B2BB", "R16": "#3ECFCA",
            "A21": "#FAE393", "C12": "#1E334E", "E6": "#EC4072", "G6": "#E3A014", "M11": "#9D7693", "R17": "#4A867A",
            "A22": "#EDF878", "C13": "#CDE7FE", "E7": "#C63674", "G7": "#985C3A", "M12": "#644B51", "R18": "#7FCD9D",
            "A23": "#E1C9BD", "C14": "#D6FDFC", "E8": "#FDDBE9", "G8": "#713D2F", "M13": "#C79266", "R19": "#CDE55D",
            "A24": "#F3F6A9", "C15": "#21C5C4", "E9": "#E575C7", "G9": "#E4B685", "M14": "#C37463", "R20": "#E8C7B4",
            "A25": "#FFD785", "C16": "#1858A2", "E10": "#D33997", "G10": "#DA8C42", "M15": "#747D7A", "R21": "#AD6F3C",
            "A26": "#FEC832", "C17": "#02D1F3", "E11": "#F7DAD4", "G11": "#DAC898", "P1": "#FCF7F8", "R22": "#6C372F",
            "B1": "#DFF139", "C18": "#213244", "E12": "#F893BF", "G12": "#FEC993", "P2": "#B0A9AC", "R23": "#FEB872",
            "B2": "#64F343", "C19": "#18869D", "E13": "#B5026A", "G13": "#B2714B", "P3": "#AFDCAB", "R24": "#F3C1C0",
            "B3": "#9FF685", "C20": "#1A70A9", "E14": "#FAD4BF", "G14": "#8B684C", "P4": "#FEA49F", "R25": "#C9675E",
            "B4": "#5FDF34", "C21": "#BEDDFC", "E15": "#F5C9CA", "G15": "#F6F8E3", "P5": "#EE8C3E", "R26": "#D293BE",
            "B5": "#39E158", "C22": "#6BB1BB", "E16": "#FBF4EC", "G16": "#F2D8C1", "P6": "#5FD0A7", "R27": "#EA8CB1",
            "B6": "#64E0A4", "C23": "#C8E2F9", "E17": "#F7E3EC", "G17": "#79544E", "P7": "#EB9270", "R28": "#9C87D6",
            "B7": "#3EAE7C", "C24": "#7EC5F9", "E18": "#FBC8DB", "G18": "#FFE4D6", "P8": "#F0D958", "T1": "#FFFFFF",
            "B8": "#1D9B54", "C25": "#A9E8E0", "E19": "#F6BBD1", "G19": "#DD7D41", "P9": "#D9D9D9", "Y1": "#FD6FB4",
            "B9": "#2A5037", "C26": "#42ADD1", "E20": "#D7C6CE", "G20": "#A5452F", "P10": "#D9C7EA", "Y2": "#FEB481",
            "B10": "#9AD1BA", "C27": "#D0DEF9", "E21": "#C09DA4", "G21": "#B38561", "P11": "#F3ECC9", "Y3": "#D7FAA0",
            "B11": "#627032", "C28": "#BDCEE8", "E22": "#B58B9F", "H1": "#FBFBFB", "H2": "#FFFFFF", "P12": "#E6EEF2", "Y4": "#8BDBFA",
            "B12": "#1A6E3D", "C29": "#364A89", "E23": "#937D8A", "H3": "#B4B4B4", "P13": "#AACBEF", "Y5": "#E987EA",
            "B13": "#C8E87D", "D1": "#ACB7EF", "E24": "#DEBEE5", "H4": "#878787", "P14": "#337680",
            "B14": "#ACE84C", "D2": "#868DD3", "F1": "#FF9280", "H5": "#464648", "P15": "#668575",
            "B15": "#305335", "D3": "#3653AF", "F2": "#F73D4B", "P16": "#FEBF45"
        };
        
        // 当前调色板（用户选择的颜色）
        this.currentPalette = new Set();
        
        this.initCanvas();
        this.organizeColors();
        this.renderPalette();
        this.setupEventListeners();
    }
    
    initCanvas() {
        this.setCanvasSize(16, 16);
    }
    
    setCanvasSize(width, height) {
        // 保存当前画布内容
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        // 设置画布的实际像素大小
        this.canvas.width = width;
        this.canvas.height = height;
        
        // 设置画布的显示大小
        this.pixelSize = this.basePixelSize * this.scale;
        this.canvas.style.width = `${width * this.pixelSize}px`;
        this.canvas.style.height = `${height * this.pixelSize}px`;
        
        // 禁用图像平滑
        this.ctx.imageSmoothingEnabled = false;
        
        // 恢复画布内容
        if (imageData.width > 0 && imageData.height > 0) {
            this.ctx.putImageData(imageData, 0, 0);
        } else {
            this.ctx.clearRect(0, 0, width, height);
        }
        
        // 更新网格
        this.drawGrid();
        
        // 保存初始状态
        this.saveState();
    }

    drawGrid() {
        const width = this.canvas.width * this.pixelSize;
        const height = this.canvas.height * this.pixelSize;
        
        // 创建网格背景
        const gridSize = this.pixelSize;
        const gridHTML = `
            <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="smallGrid" width="${gridSize}" height="${gridSize}" patternUnits="userSpaceOnUse">
                        <path d="M ${gridSize} 0 L 0 0 0 ${gridSize}" fill="none" stroke="#888" stroke-width="1"/>
                    </pattern>
                    <pattern id="largeGrid" width="${gridSize*5}" height="${gridSize*5}" patternUnits="userSpaceOnUse">
                        <rect width="${gridSize*5}" height="${gridSize*5}" fill="url(#smallGrid)"/>
                        <path d="M ${gridSize*5} 0 L 0 0 0 ${gridSize*5}" fill="none" stroke="#000" stroke-width="2"/>
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#largeGrid)" />
            </svg>
        `;
        
        this.gridOverlay.innerHTML = gridHTML;
        this.gridOverlay.style.width = `${width}px`;
        this.gridOverlay.style.height = `${height}px`;
    }
    
    organizeColors() {
        this.colorGroups = {};
        const mainGroups = ['A','B','C','D','E','F','G','H','M'];
        
        // 先处理主要色系
        mainGroups.forEach(prefix => {
            this.colorGroups[prefix] = [];
        });
        
        // 添加"其他"分类
        this.colorGroups['其他'] = [];
        
        // 分配颜色到对应分类
        Object.entries(this.colorLibrary).forEach(([id, color]) => {
            const prefix = id.match(/^[A-Z]+/)[0];
            if (mainGroups.includes(prefix)) {
                this.colorGroups[prefix].push({ id, color });
            } else {
                this.colorGroups['其他'].push({ id, color });
            }
        });
        
        // 对每个组内的颜色按ID排序
        Object.keys(this.colorGroups).forEach(prefix => {
            this.colorGroups[prefix].sort((a, b) => {
                const numA = parseInt(a.id.replace(/[A-Z]+/, ''));
                const numB = parseInt(b.id.replace(/[A-Z]+/, ''));
                return numA - numB;
            });
        });
    }
    
    renderPalette() {
        this.colorCategories.innerHTML = '';
        
        Object.entries(this.colorGroups).forEach(([prefix, colors]) => {
            const category = document.createElement('div');
            category.className = 'color-category';
            
            const header = document.createElement('div');
            header.className = 'category-header';
            
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'toggle-btn';
            toggleBtn.textContent = '▼';
            toggleBtn.addEventListener('click', () => {
                grid.style.display = grid.style.display === 'none' ? 'grid' : 'none';
                toggleBtn.textContent = grid.style.display === 'none' ? '▼' : '▲';
            });
            
            const title = document.createElement('span');
            title.textContent = `${prefix}色系`;
            
            header.appendChild(toggleBtn);
            header.appendChild(title);
            
            const grid = document.createElement('div');
            grid.className = 'color-grid';
            
            colors.forEach(({ id, color }) => {
                const colorItem = document.createElement('div');
                colorItem.className = 'color-item';
                colorItem.style.backgroundColor = color;
                colorItem.title = `${id}: ${color}`;
                colorItem.dataset.colorId = id;
                colorItem.dataset.color = color;
                
                const colorId = document.createElement('div');
                colorId.className = 'color-id';
                colorId.textContent = id;
                colorItem.appendChild(colorId);
                
                // 修改点击事件，改为添加到调色板
                colorItem.addEventListener('click', () => this.addToCustomPalette(id, color));
                
                grid.appendChild(colorItem);
            });
            
            category.appendChild(header);
            category.appendChild(grid);
            this.colorCategories.appendChild(category);
        });
        
        this.setupSearch();
    }
    
    setupSearch() {
        this.searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            
            document.querySelectorAll('.color-item').forEach(item => {
                const id = item.dataset.colorId.toLowerCase();
                const color = item.dataset.color.toLowerCase();
                const category = item.closest('.color-category');
                
                if (id.includes(searchTerm) || color.includes(searchTerm)) {
                    item.style.display = '';
                    category.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });
            
            // 隐藏空分类
            document.querySelectorAll('.color-category').forEach(category => {
                const visibleItems = category.querySelectorAll('.color-item[style=""]').length;
                category.style.display = visibleItems > 0 ? '' : 'none';
            });
        });
    }
    
    addToCustomPalette(id, color) {
        // 如果颜色已经在调色板中，则移除它
        if (this.currentPalette.has(id)) {
            this.currentPalette.delete(id);
            const existingItem = this.customPalette.querySelector(`[data-color-id="${id}"]`);
            if (existingItem) {
                existingItem.remove();
            }
        } else {
            // 添加到调色板
            this.currentPalette.add(id);
            const colorItem = document.createElement('div');
            colorItem.className = 'color-item';
            colorItem.style.backgroundColor = color;
            colorItem.title = `${id}: ${color}`;
            colorItem.dataset.colorId = id;
            colorItem.dataset.color = color;
            
            const colorId = document.createElement('div');
            colorId.className = 'color-id';
            colorId.textContent = id;
            colorItem.appendChild(colorId);
            
            // 点击调色板中的颜色时选择它
            colorItem.addEventListener('click', () => this.selectColor(id, color));
            
            this.customPalette.appendChild(colorItem);
        }
    }
    
    selectColor(id, color) {
        this.currentColor = { id, color };
        // 移除所有颜色项的active类
        document.querySelectorAll('.color-item').forEach(item => {
            item.classList.remove('active');
        });
        // 为当前选中的颜色添加active类
        event.target.classList.add('active');
    }
    
    setupEventListeners() {
        // 工具选择
        document.querySelectorAll('.tool').forEach(tool => {
            tool.addEventListener('click', () => {
                document.querySelectorAll('.tool').forEach(t => t.classList.remove('active'));
                tool.classList.add('active');
                this.currentTool = tool.id;
            });
        });
        
        // 画布事件
        this.canvas.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.isDrawing = true;
            this.saveState();
            this.handleDraw(e);
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            e.preventDefault();
            if (this.isDrawing) {
                this.handleDraw(e);
            }
            this.updateColorInfo(e);
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.isDrawing = false;
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            this.isDrawing = false;
        });
        
        // 画布尺寸
        document.getElementById('canvasWidth').addEventListener('change', (e) => {
            const width = Math.min(100, Math.max(1, parseInt(e.target.value)));
            const height = parseInt(document.getElementById('canvasHeight').value);
            this.setCanvasSize(width, height);
        });
        
        document.getElementById('canvasHeight').addEventListener('change', (e) => {
            const height = Math.min(100, Math.max(1, parseInt(e.target.value)));
            const width = parseInt(document.getElementById('canvasWidth').value);
            this.setCanvasSize(width, height);
        });
        
        // 画布比例
        this.canvasScale.addEventListener('input', (e) => {
            this.scale = parseFloat(e.target.value);
            this.scaleValue.textContent = `${this.scale}x`;
            this.setCanvasSize(this.canvas.width, this.canvas.height);
        });
        
        // 色库折叠
        this.toggleLibraryBtn.addEventListener('click', () => {
            const categories = this.colorCategories;
            const isCollapsed = categories.style.display === 'none';
            categories.style.display = isCollapsed ? 'block' : 'none';
            this.toggleLibraryBtn.textContent = isCollapsed ? '▼' : '▲';
        });
        
        // 撤销/重做/保存/加载/导出
        document.getElementById('undo').addEventListener('click', () => this.undo());
        document.getElementById('redo').addEventListener('click', () => this.redo());
        document.getElementById('save').addEventListener('click', () => this.saveProject());
        document.getElementById('load').addEventListener('click', () => this.loadProject());
        document.getElementById('export').addEventListener('click', () => this.exportToPNG());
        
        // 快捷键绑定
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return; // 忽略输入框中的按键
            
            switch(e.key) {
                case '1':
                    this.currentTool = 'pencil';
                    document.getElementById('pencil').click();
                    break;
                case '2':
                    this.currentTool = 'eraser';
                    document.getElementById('eraser').click();
                    break;
                case '3':
                    this.currentTool = 'bucket';
                    document.getElementById('bucket').click();
                    break;
            }
        });
    }
    
    handleDraw(e) {
        if (!this.currentColor) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / this.pixelSize);
        const y = Math.floor((e.clientY - rect.top) / this.pixelSize);
        
        if (x >= 0 && x < this.canvas.width && y >= 0 && y < this.canvas.height) {
            switch (this.currentTool) {
                case 'pencil':
                    this.drawPixel(x, y);
                    break;
                case 'eraser':
                    this.erasePixel(x, y);
                    break;
                case 'bucket':
                    this.fillArea(x, y);
                    break;
            }
        }
    }
    
    updateColorInfo(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / this.pixelSize);
        const y = Math.floor((e.clientY - rect.top) / this.pixelSize);
        
        if (x >= 0 && x < this.canvas.width && y >= 0 && y < this.canvas.height) {
            const pixel = this.ctx.getImageData(x, y, 1, 1).data;
            const color = `#${pixel[0].toString(16).padStart(2, '0')}${pixel[1].toString(16).padStart(2, '0')}${pixel[2].toString(16).padStart(2, '0')}`;
            const colorId = this.findColorId(color);
            this.colorInfo.textContent = colorId ? `位置: (${x}, ${y}) 颜色: ${colorId}` : `位置: (${x}, ${y})`;
        } else {
            this.colorInfo.textContent = '';
        }
    }
    
    drawPixel(x, y) {
        if (!this.currentColor) return;
        
        this.ctx.fillStyle = this.currentColor.color;
        this.ctx.fillRect(x, y, 1, 1);
        this.redrawCanvas();
    }
    
    erasePixel(x, y) {
        this.ctx.clearRect(x, y, 1, 1);
        this.redrawCanvas();
    }
    
    fillArea(x, y) {
        const targetColor = this.getPixelColor(x, y);
        if (targetColor === this.currentColor.color) return;
        
        const stack = [[x, y]];
        const visited = new Set();
        
        while (stack.length > 0) {
            const [currentX, currentY] = stack.pop();
            const key = `${currentX},${currentY}`;
            
            if (visited.has(key)) continue;
            visited.add(key);
            
            if (this.getPixelColor(currentX, currentY) !== targetColor) continue;
            
            this.drawPixel(currentX, currentY);
            
            if (currentX > 0) stack.push([currentX - 1, currentY]);
            if (currentX < this.canvas.width - 1) stack.push([currentX + 1, currentY]);
            if (currentY > 0) stack.push([currentX, currentY - 1]);
            if (currentY < this.canvas.height - 1) stack.push([currentX, currentY + 1]);
        }
    }
    
    getPixelColor(x, y) {
        const pixel = this.ctx.getImageData(x, y, 1, 1).data;
        return `#${pixel[0].toString(16).padStart(2, '0')}${pixel[1].toString(16).padStart(2, '0')}${pixel[2].toString(16).padStart(2, '0')}`;
    }
    
    saveState() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push(imageData);
        
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
        
        this.historyIndex = this.history.length - 1;
    }
    
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.ctx.putImageData(this.history[this.historyIndex], 0, 0);
            this.redrawCanvas();
            // 保持当前工具状态不变
            document.getElementById(this.currentTool).classList.add('active');
            return true;
        }
        return false;
    }
    
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.ctx.putImageData(this.history[this.historyIndex], 0, 0);
            this.redrawCanvas();
            // 保持当前工具状态不变
            document.getElementById(this.currentTool).classList.add('active');
            return true;
        }
        return false;
    }
    
    findColorId(color) {
        if (!this.colorLibrary) return null;
        return Object.entries(this.colorLibrary).find(([_, value]) => value.toLowerCase() === color.toLowerCase())?.[0];
    }
    
    exportData() {
        const data = [];
        for (let y = 0; y < this.canvas.height; y++) {
            const row = [];
            for (let x = 0; x < this.canvas.width; x++) {
                const color = this.getPixelColor(x, y);
                const colorId = this.findColorId(color);
                row.push(colorId || '');
            }
            data.push(row);
        }
        return data;
    }
    
    redrawCanvas() {
        // 保存当前内容
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        // 恢复内容
        this.ctx.putImageData(imageData, 0, 0);
    }

    getTimeStamp() {
        const pad = n => String(n).padStart(2, '0'); // 补零工具函数
        const now = new Date();
        
        return `${now.getFullYear()}年${
          pad(now.getMonth() + 1)}月${
          pad(now.getDate())}日${
          pad(now.getHours())}:${
          pad(now.getMinutes())}`;
      }
      

    exportToPNG() {
        // 创建临时canvas来导出
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // 复制内容到临时canvas
        tempCtx.putImageData(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height), 0, 0);
        
        // 创建下载链接
        const link = document.createElement('a');
        link.download = `${this.getTimeStamp()} 导出的图片.png`;
        link.href = tempCanvas.toDataURL('image/png');
        link.click();
    }

    saveProject() {
        const project = {
            canvasData: this.exportData(),
            palette: Array.from(this.currentPalette),
            width: this.canvas.width,
            height: this.canvas.height,
            scale: this.scale
        };

        const dataStr = JSON.stringify(project);
        const blob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.download = `${this.getTimeStamp()} 导出的绘画项目.json`;
        link.href = url;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    loadProject() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = event => {
                try {
                    const project = JSON.parse(event.target.result);
                    
                    // 设置画布尺寸
                    this.setCanvasSize(project.width, project.height);
                    
                    // 恢复调色板
                    this.currentPalette.clear();
                    this.customPalette.innerHTML = '';
                    project.palette.forEach(id => {
                        const color = this.colorLibrary[id];
                        if (color) {
                            this.addToCustomPalette(id, color);
                        }
                    });
                    
                    // 恢复画布内容
                    const imageData = this.ctx.createImageData(project.width, project.height);
                    for (let y = 0; y < project.height; y++) {
                        for (let x = 0; x < project.width; x++) {
                            const colorId = project.canvasData[y][x];
                            if (colorId && this.colorLibrary[colorId]) {
                                const color = this.hexToRgb(this.colorLibrary[colorId]);
                                const index = (y * project.width + x) * 4;
                                imageData.data[index] = color.r;
                                imageData.data[index+1] = color.g;
                                imageData.data[index+2] = color.b;
                                imageData.data[index+3] = 255;
                            }
                        }
                    }
                    this.ctx.putImageData(imageData, 0, 0);
                    
                    // 恢复比例
                    this.scale = project.scale;
                    this.canvasScale.value = project.scale;
                    this.scaleValue.textContent = `${project.scale}x`;
                    this.setCanvasSize(project.width, project.height);
                    
                    // 重置历史记录
                    this.history = [];
                    this.historyIndex = -1;
                    this.saveState();
                    
                } catch (error) {
                    console.error('加载项目失败:', error);
                    alert('加载项目失败，文件可能已损坏');
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : {r: 0, g: 0, b: 0};
    }
}

// 初始化应用
window.addEventListener('load', () => {
    window.pixelArt = new PixelArt();
});
