let scheduleData = {
    courseName: "",
    courseCode: "",
    startDate: "",
    endDate: "",
    daysOfWeek: [],
    rows: []
};

document.addEventListener('DOMContentLoaded', () => {
    loadSchedule();
    enableColumnResizing();
});

function enableColumnResizing() {
    const headers = document.querySelectorAll('#scheduleTable th');
    headers.forEach(header => {
        const handle = document.createElement('div');
        handle.className = 'resize-handle';
        header.appendChild(handle);
        
        let startX, startWidth;
        
        handle.addEventListener('mousedown', (e) => {
            startX = e.clientX;
            startWidth = header.offsetWidth;
            document.documentElement.style.cursor = 'col-resize';
            
            document.addEventListener('mousemove', doResize);
            document.addEventListener('mouseup', stopResize);
        });

        const doResize = (e) => {
            const newWidth = startWidth + (e.clientX - startX);
            header.style.width = `${newWidth}px`;
            Array.from(header.parentNode.children).forEach(th => {
                th.style.width = `${th.offsetWidth}px`;
            });
        };

        const stopResize = () => {
            document.documentElement.style.cursor = 'default';
            document.removeEventListener('mousemove', doResize);
            document.removeEventListener('mouseup', stopResize);
        };
    });
}

// ======================
// SCHEDULE GENERATION
// ======================
function generateSchedule() {
    // Get basic course info
    scheduleData.courseName = document.getElementById('courseName').value;
    scheduleData.courseCode = document.getElementById('courseCode').value;
    scheduleData.startDate = document.getElementById('startDate').value;
    scheduleData.endDate = document.getElementById('endDate').value;

    // Update displayed course info
    document.getElementById('displayCourseName').textContent = scheduleData.courseName || 'N/A';
    document.getElementById('displayCourseCode').textContent = scheduleData.courseCode || 'N/A';
    
    // Get selected days
    scheduleData.daysOfWeek = Array.from(document.querySelectorAll('input[name="days"]:checked'))
                                 .map(checkbox => parseInt(checkbox.value));

    // Clear existing rows
    scheduleData.rows = [];

    // Generate dates between start and end dates
    const start = new Date(scheduleData.startDate);
    const end = new Date(scheduleData.endDate);
    
    let currentDate = new Date(start);
    let weekCounter = 1;
    let currentWeekStart = new Date(start);
    currentWeekStart.setDate(start.getDate() - start.getDay() + 1); // Monday-based week

    while (currentDate <= end) {
        // Check if current day is selected
        if (scheduleData.daysOfWeek.includes(currentDate.getDay())) {
            const weekNumber = getWeekNumber(currentDate);
            
            scheduleData.rows.push({
                week: weekNumber,
                date: currentDate.toISOString().split('T')[0],
                title: "",
                contents: "",
                practices: "",
                assignments: "",
                links: "",
                notes: ""
            });
        }

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
    }

    renderTable();
    saveSchedule();
}

// ======================
// TABLE MANAGEMENT
// ======================

// Helper function to group by week
function groupByWeek() {
    const weeks = {};
    scheduleData.rows.forEach((row, index) => {
        const weekKey = row.week;
        if (!weeks[weekKey]) {
            weeks[weekKey] = {
                start: index,
                count: 1
            };
        } else {
            weeks[weekKey].count++;
        }
    });
    return weeks;
}

// Column Config
let columnConfig = [
    { key: 'week', title: 'Week', type: 'text', deletable: false },
    { key: 'date', title: 'Date', type: 'date', deletable: true },
    { key: 'title', title: 'Title', type: 'text', deletable: true },
    { key: 'contents', title: 'Contents', type: 'text', deletable: true },
    { key: 'practices', title: 'Practices', type: 'text', deletable: true },
    { key: 'assignments', title: 'Assignments', type: 'text', deletable: true },
    { 
        key: 'links', 
        title: 'Links', 
        type: 'url',  // Special type for URL handling
        deletable: true,
        validation: {
            pattern: 'https?://.+',  // Basic URL pattern validation
            errorMessage: 'Must be a valid URL (start with http:// or https://)'
        }
    },
    { key: 'notes', title: 'Notes', type: 'text', deletable: true }
];

// Add New Column Function
function addNewColumn() {
    const colName = prompt("Enter new column name:");
    if (colName) {
        const newCol = {
            key: colName.toLowerCase().replace(/\s+/g, '_'),
            title: colName,
            type: 'text',
            deletable: true
        };
        columnConfig.push(newCol);
        renderTable();
        saveColumnConfig();
    }
}

// Delete Column Function
function deleteColumn(colKey) {
    if (confirm("Delete this column and all its data?")) {
        columnConfig = columnConfig.filter(col => col.key !== colKey);
        scheduleData.rows.forEach(row => delete row[colKey]);
        renderTable();
        saveColumnConfig();
    }
}

function addNewColumn() {
    const title = prompt('Enter new column name:');
    if (title) {
        columnConfig.push({
            key: title.toLowerCase().replace(/\s+/g, '_'),
            title: title,
            visible: true
        });
        renderTable();
    }
}


function renderTable() {
    const thead = document.querySelector('#scheduleTable thead');
    const tbody = document.querySelector('#scheduleTable tbody');
    const weekGroups = groupByWeek();
    let output = '';
    let currentWeek = null;
    let rowCounter = 0;

    scheduleData.rows.forEach((row, index) => {
        if (row.week !== currentWeek) {
            currentWeek = row.week;
            const weekSpan = weekGroups[row.week].count;
            output += `<tr>
                <td rowspan="${weekSpan}">${row.week}</td>
                ${renderRowCells(row, index)}
            </tr>`;
            rowCounter += weekSpan - 1;
        } else if (rowCounter > 0) {
            output += `<tr>${renderRowCells(row, index)}</tr>`;
            rowCounter--;
        }
    });

    // Render Header
    thead.innerHTML = `
        <tr>
            ${columnConfig.map(col => `
                <th class="${col.deletable ? 'deletable' : ''}">
                    <div class="th-header-wrapper">
                        ${col.title}
                        ${col.deletable ? 
                            `<span class="delete-column-btn" onclick="deleteColumn('${col.key}')">✕</span>` : ''}
                    </div>
                </th>
            `).join('')}
            <th>Actions</th>
        </tr>
    `;
    
    // Render Body
    tbody.innerHTML = output;
}

// Save column config
function saveColumnConfig() {
    localStorage.setItem('columnConfig', JSON.stringify(columnConfig));
}

// Load column config
function loadColumnConfig() {
    const savedConfig = localStorage.getItem('columnConfig');
    if (savedConfig) {
        columnConfig = JSON.parse(savedConfig);
    }
}

// Update renderRowCells() to use columnConfig
function renderRowCells(row, index) {
    return columnConfig.map(col => {
        if (!col.visible) return '';

        let inputField;
        switch(col.type) {
            case 'date':
                inputField = `<input type="date" value="${row[col.key] || ''}" 
                                  oninput="updateRow(${index}, '${col.key}', this.value)">`;
                break;
            case 'url':
                inputField = `
                    <input type="url" 
                           value="${row[col.key] || ''}"
                           pattern="${col.validation.pattern}"
                           title="${col.validation.errorMessage}"
                           oninput="updateRow(${index}, '${col.key}', this.value)">`;
                break;
            default:
                inputField = `<textarea oninput="updateRow(${index}, '${col.key}', this.value)"
                                      >${row[col.key] || ''}</textarea>`;
        }

        return `
            <td>
                ${col.key === 'week' ? '' : `
                    ${col.key === 'date' ? `
                        <input type="date" value="${row[col.key]}" 
                            oninput="updateRow(${index}, '${col.key}', this.value)">
                    ` : `
                        <textarea oninput="updateRow(${index}, '${col.key}', this.value)">
                            ${row[col.key] || ''}
                        </textarea>
                    `}
                `}
            </td>
        `;
    }).join('') + `<td><span class="delete-btn" onclick="deleteRow(${index})">✕</span></td>`;
}

function updateRow(index, field, value) {
    scheduleData.rows[index][field] = value;
    
    // Recalculate week if date changes
    if (field === 'date') {
        scheduleData.rows[index].week = getWeekNumber(value);
    }
    
    saveSchedule();
}

// ======================
// UTILITY FUNCTIONS
// ======================
function getWeekNumber(dateString) {
    const date = new Date(dateString);
    if (isNaN(date)) return '';
    
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    startOfYear.setDate(startOfYear.getDate() + (1 - startOfYear.getDay()));
    const diff = date - startOfYear;
    return Math.ceil(diff / 604800000) + 1; // 604800000 = ms in a week
}

function deleteRow(index) {
    scheduleData.rows.splice(index, 1);
    renderTable();
    saveSchedule();
}

// ======================
// DATA PERSISTENCE
// ======================
function saveSchedule() {
    localStorage.setItem('scheduleData', JSON.stringify(scheduleData));
}

function loadSchedule() {
    loadColumnConfig();
    const data = localStorage.getItem('scheduleData');
    if (data) {
        scheduleData = JSON.parse(data);
        // Restore UI values
        document.getElementById('courseName').value = scheduleData.courseName;
        document.getElementById('courseCode').value = scheduleData.courseCode;
        document.getElementById('startDate').value = scheduleData.startDate;
        document.getElementById('endDate').value = scheduleData.endDate;

        // Restore displayed course info
        document.getElementById('displayCourseName').textContent = scheduleData.courseName || 'N/A';
        document.getElementById('displayCourseCode').textContent = scheduleData.courseCode || 'N/A';
        
        // Restore checkboxes
        document.querySelectorAll('input[name="days"]').forEach(checkbox => {
            checkbox.checked = scheduleData.daysOfWeek.includes(parseInt(checkbox.value));
        });
        
        renderTable();
    }
}

// Keep existing export functions (modify headers if needed)

function exportExcel() {
    if (scheduleData.rows.length === 0) {
        alert("No data to export!");
        return;
    }

    // Create worksheet data with course info
    const headers = ["Week", "Date", "Title", "Contents", "Practices", "Assignments", "Links", "Notes"];
    const fullData = [
        [`Course Name: ${scheduleData.courseName || 'N/A'}`], // Row 1
        [`Course Code: ${scheduleData.courseCode || 'N/A'}`], // Row 2
        [], // Empty row
        headers, // Row 4 (headers)
        ...scheduleData.rows.map(row => [ // Data rows
            row.week,
            row.date,
            row.title,
            row.contents,
            row.practices,
            row.assignments,
            row.links, { t: 's', v: row.links, l: { Target: row.links } }, // Create hyperlink
            row.notes
        ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(fullData);

    // Add styling
    const courseNameCell = worksheet['A1'];
    if (courseNameCell) {
        courseNameCell.s = {
            font: { bold: true, color: { rgb: "000000" }, sz: 14 },
            fill: { fgColor: { rgb: "DDEBF7" } }
        };
    }

    const courseCodeCell = worksheet['A2'];
    if (courseCodeCell) {
        courseCodeCell.s = {
            font: { bold: true, color: { rgb: "000000" }, sz: 12 },
            fill: { fgColor: { rgb: "E2EFDA" } }
        };
    }
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Schedule");
    XLSX.writeFile(workbook, "course_schedule.xlsx");
}

function exportPDF() {
    if (scheduleData.rows.length === 0) {
        alert("No data to export!");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
    });

    // Add course info
    doc.setFontSize(12);
    doc.text(`Course: ${scheduleData.courseName} (${scheduleData.courseCode})`, 14, 20);

    // Find links column index
    const linksColIndex = columnConfig.findIndex(col => col.key === 'links');

    // Create table
    const table = doc.autoTable({
        startY: 30,
        head: [columnConfig.map(col => col.title).concat('Actions')],
        body: scheduleData.rows.map(row => 
            columnConfig.map(col => row[col.key]).concat('')
        ),
        styles: { 
            fontSize: 9,
            cellPadding: 1.5,
            valign: 'middle'
        },
        didDrawCell: (data) => {
            // Check if current column is links column
            if (data.column.index === linksColIndex && data.cell.raw) {
                const url = data.cell.raw;
                if (isValidUrl(url)) {
                    // Add clickable link
                    doc.link(
                        data.cell.x,
                        data.cell.y,
                        data.cell.width,
                        data.cell.height,
                        { url: url }
                    );
                    
                    // Style as hyperlink (blue + underline)
                    doc.setTextColor(0, 0, 255);
                    doc.setFont(undefined, 'underline');
                    doc.text(url, data.cell.x + 2, data.cell.y + 5);
                    doc.setTextColor(0, 0, 0);
                    doc.setFont(undefined, 'normal');
                }
            }
        }
    });

    doc.save('course_schedule.pdf');
}

// Helper function to validate URLs
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}