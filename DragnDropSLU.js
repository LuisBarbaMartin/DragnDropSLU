// TODO figure this shit out

let boxCount = 0;
const workspace = document.getElementById("workspace");
// Grid settings for snapping
const GRID_X = 210; // box width (200px) + 10px gap
const GRID_Y = 50;  // approximate box height + small gap
const GRID_OFFSET_X = 5; // half of the horizontal gap
const GRID_OFFSET_Y = 5; // half of the vertical gap

// Snap an element to the grid and clamp inside the workspace bounds
function snapAndClamp(el) {
  const wsRect = workspace.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();

  // current element position relative to workspace
  let left = elRect.left - wsRect.left;
  let top = elRect.top - wsRect.top;

  // snap to nearest grid with offset
  left = Math.round((left - GRID_OFFSET_X) / GRID_X) * GRID_X + GRID_OFFSET_X;
  top = Math.round((top - GRID_OFFSET_Y) / GRID_Y) * GRID_Y + GRID_OFFSET_Y;

  // clamp so the box stays fully inside workspace
  const maxLeft = Math.max(0, Math.round(wsRect.width - elRect.width));
  const maxTop = Math.max(0, Math.round(wsRect.height - elRect.height));
  left = Math.max(0, Math.min(left, maxLeft));
  top = Math.max(0, Math.min(top, maxTop));

  // apply as style (relative to workspace because workspace is positioned)
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
}

// Robust Add Box hookup: works whether DOMContentLoaded already fired or not.
(function initAddBoxUI() {
  function setupAddBox() {
    const addBoxBtn = document.getElementById('addBoxBtn');
    const boxTitleInput = document.getElementById('boxTitle');
    if (!addBoxBtn || !boxTitleInput) return false;

    function handler() {
      const title = boxTitleInput.value.trim() || `Box ${boxCount + 1}`;
      // create the box centered in the workspace
      const wsRect = workspace.getBoundingClientRect();
      const cx = wsRect.left + wsRect.width / 2;
      const cy = wsRect.top + wsRect.height / 2;
      createFloatingBox(title, cx, cy);
      boxTitleInput.value = '';
    }

    // Attach click handler (avoid duplicates)
    addBoxBtn.removeEventListener('click', handler);
    addBoxBtn.addEventListener('click', handler);

    // Attach Enter key on input
    function handleKeydown(e) {
      if (e.key === 'Enter') handler();
    }
    boxTitleInput.removeEventListener('keydown', handleKeydown);
    boxTitleInput.addEventListener('keydown', handleKeydown);

    return true;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (!setupAddBox()) setTimeout(setupAddBox, 50);
    });
  } else {
    if (!setupAddBox()) setTimeout(setupAddBox, 50);
  }
})();

function createFloatingBox(title, startX, startY) {
  boxCount++;
  const newBox = document.createElement("div");
  newBox.id = `dragg${boxCount}`;
  
  // Determine semester type and add appropriate class
  let className = "draggable";
  if (title.toLowerCase().includes("spring")) {
    className += " spring";
  } else if (title.toLowerCase().includes("summer")) {
    className += " summer";
  } else if (title.toLowerCase().includes("fall")) {
    className += " fall";
  } else if (title.toLowerCase().includes("mat-")) {
    className += " math";
  }
  newBox.className = className;
  newBox.style.top = `${startY - 40}px`;
  newBox.style.left = `${startX - 100}px`;
  newBox.innerHTML = `
    <div id="${newBox.id}header" class="drag-header">
      ${title}
      <button class="delete-btn" title="Delete box">✖</button>
    </div>
  `;

  workspace.appendChild(newBox);
  dragElement(newBox);

  // Snap to grid and ensure inside workspace on creation
  snapAndClamp(newBox);

  // delete button
  newBox.querySelector(".delete-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    newBox.remove();
  });
}


// ---- Drag Function ----
function dragElement(elmnt) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  const header = document.getElementById(elmnt.id + "header");

  if (header) {
    header.onmousedown = dragMouseDown;
  } else {
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // ignore clicks on the delete button
    if (e.target.classList.contains("delete-btn")) return;

    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
    // snap to grid when user releases the mouse
    snapAndClamp(elmnt);
  }
}

// Initialize existing draggable elements when the page loads
// Tab switching functionality
function switchTab(tabId) {
    // Hide all content
    document.querySelectorAll('.bin-content').forEach(content => {
        content.classList.remove('active');
    });
    // Deactivate all tabs
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected content and activate tab
    document.getElementById(tabId).classList.add('active');
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize bin items clicking
    document.querySelectorAll(".bin-item").forEach(item => {
        item.addEventListener("click", () => {
            const wsRect = workspace.getBoundingClientRect();
            // Create box in center of workspace
            createFloatingBox(item.dataset.title, 
                wsRect.left + wsRect.width/2,
                wsRect.top + wsRect.height/2);
        });
    });

    // Initialize Delete All button
    const deleteAllBtn = document.getElementById('deleteAllBtn');
    if (deleteAllBtn) {
        deleteAllBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete all boxes?')) {
                const draggables = workspace.querySelectorAll('.draggable');
                draggables.forEach(box => box.remove());
            }
        });
    }

    // Initialize tab switching
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.addEventListener('click', () => {
            switchTab(tab.dataset.tab);
        });
    });

    // Initialize draggable elements
    document.querySelectorAll('.draggable').forEach(el => {
        // Initialize dragging
        dragElement(el);
        
        // Initialize delete buttons for existing boxes
        const deleteBtn = el.querySelector(".delete-btn");
        if (deleteBtn) {
            deleteBtn.addEventListener("click", (e) => {
                e.stopPropagation(); // prevent drag from triggering
                el.remove();
            });
        }
    });
});
