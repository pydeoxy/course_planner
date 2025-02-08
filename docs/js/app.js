// Initialize table with empty data
let scheduleData = [];

document.addEventListener('DOMContentLoaded', () => {
    loadSchedule();
});

function addRow() {
    const newRow = {
        week: '',
        date: '',
        title: '',
        contents: '',
        practices: '',
        assignments: '',
        links: '',
        notes: ''
    };
    
    scheduleData.push(newRow);
    renderTable();
    focusLastRow();
}

function renderTable() {
    const tbody = document.querySelector('#scheduleTable tbody');
    tbody.innerHTML = scheduleData.map((row, index) => `
        <tr>
            <td><input type="text" value="${row.week}" oninput="updateCell(${index}, 'week', this.value)"></td>
            <td><input type="date" value="${row.date}" oninput="updateCell(${index}, 'date', this.value)"></td>
            <td><input type="text" value="${row.title}" oninput="updateCell(${index}, 'title', this.value)"></td>
            <td><textarea oninput="updateCell(${index}, 'contents', this.value)">${row.contents}</textarea></td>
            <td><textarea oninput="updateCell(${index}, 'practices', this.value)">${row.practices}</textarea></td>
            <td><textarea oninput="updateCell(${index}, 'assignments', this.value)">${row.assignments}</textarea></td>
            <td><input type="url" value="${row.links}" oninput="updateCell(${index}, 'links', this.value)"></td>
            <td><textarea oninput="updateCell(${index}, 'notes', this.value)">${row.notes}</textarea></td>
            <td><span class="delete-btn" onclick="deleteRow(${index})">✕</span></td>
        </tr>
    `).join('');
}

function updateCell(index, field, value) {
    scheduleData[index][field] = value;
    saveSchedule();
}

function deleteRow(index) {
    scheduleData.splice(index, 1);
    renderTable();
    saveSchedule();
}

function focusLastRow() {
    const lastRow = document.querySelector('#scheduleTable tbody tr:last-child');
    if (lastRow) {
        lastRow.querySelector('input').focus();
    }
}

// Save/Load functions
function saveSchedule() {
    localStorage.setItem('scheduleData', JSON.stringify(scheduleData));
}

function loadSchedule() {
    const data = localStorage.getItem('scheduleData');
    if (data) {
        scheduleData = JSON.parse(data);
        renderTable();
    }
}

// Export functions
function exportExcel() {
    const worksheet = XLSX.utils.json_to_sheet(scheduleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Schedule");
    XLSX.writeFile(workbook, "course_schedule.xlsx");
}

function exportPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'landscape'
    });

    // Add table to PDF
    doc.autoTable({
        head: [['Week', 'Date', 'Title', 'Contents', 'Practices', 'Assignments', 'Links', 'Notes']],
        body: scheduleData.map(row => [
            row.week,
            row.date,
            row.title,
            row.contents,
            row.practices,
            row.assignments,
            row.links,
            row.notes
        ])
    });

    doc.save('course_schedule.pdf');
}