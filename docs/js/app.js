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
});

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
function renderTable() {
    const tbody = document.querySelector('#scheduleTable tbody');
    tbody.innerHTML = scheduleData.rows.map((row, index) => {
        return `
            <tr>
                <td>${row.week}</td>
                <td>
                    <input type="date" 
                           value="${row.date}" 
                           oninput="updateRow(${index}, 'date', this.value)">
                </td>
                <td><input type="text" value="${row.title}" oninput="updateRow(${index}, 'title', this.value)"></td>
                <td><textarea oninput="updateRow(${index}, 'contents', this.value)">${row.contents}</textarea></td>
                <td><textarea oninput="updateRow(${index}, 'practices', this.value)">${row.practices}</textarea></td>
                <td><textarea oninput="updateRow(${index}, 'assignments', this.value)">${row.assignments}</textarea></td>
                <td><input type="url" value="${row.links}" oninput="updateRow(${index}, 'links', this.value)"></td>
                <td><textarea oninput="updateRow(${index}, 'notes', this.value)">${row.notes}</textarea></td>
                <td><span class="delete-btn" onclick="deleteRow(${index})">✕</span></td>
            </tr>
        `;
    }).join('');
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
            row.links,
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

    // Create table
    doc.autoTable({
        startY: 30,
        head: [['Week', 'Date', 'Title', 'Contents', 'Practices', 'Assignments', 'Links', 'Notes']],
        body: scheduleData.rows.map(row => [
            row.week,
            row.date,
            row.title,
            row.contents,
            row.practices,
            row.assignments,
            row.links,
            row.notes
        ]),
        styles: { fontSize: 9 },
        columnStyles: {
            0: { cellWidth: 15 },
            1: { cellWidth: 25 },
            2: { cellWidth: 30 },
            3: { cellWidth: 40 },
            4: { cellWidth: 30 },
            5: { cellWidth: 30 },
            6: { cellWidth: 30 },
            7: { cellWidth: 30 }
        }
    });

    doc.save('course_schedule.pdf');
}