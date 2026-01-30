let selectedFile = null;
let workbookCache = null;
let tablesMap = {};

function cleanCell(value) {
  if (value === null || value === undefined) return "";

  let str = String(value);

  // Remove non-breaking spaces
  str = str.replace(/\u00A0/g, ' ');

  // Remove hidden control characters (SAP / Excel junk)
  str = str.replace(/[\u0000-\u001F\u007F]/g, '');

  return str.trim();
}

function excelDateToJSDate(serial) {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);

  const fractional_day = serial - Math.floor(serial) + 0.0000001;
  let total_seconds = Math.floor(86400 * fractional_day);

  const seconds = total_seconds % 60;
  total_seconds -= seconds;
  const hours = Math.floor(total_seconds / 3600);
  const minutes = Math.floor(total_seconds / 60) % 60;

  date_info.setHours(hours);
  date_info.setMinutes(minutes);
  date_info.setSeconds(seconds);

  return date_info;
}

function formatDate(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

document.getElementById('excelInput').addEventListener('change', function (e) {
  selectedFile = e.target.files[0];
  if (!selectedFile) return;

  document.getElementById('processBtn').disabled = false;
  document.getElementById('statusText').textContent = 'File selected. Ready to process.';
});

document.getElementById('processBtn').addEventListener('click', function () {
  if (!selectedFile) return;

  const statusText = document.getElementById('statusText');
  const progressBar = document.getElementById('progressBar');
  const progressContainer = document.getElementById('progressBarContainer');

  statusText.textContent = 'Processing Excel...';
  progressContainer.style.display = 'block';
  progressBar.style.width = '0%';

  const reader = new FileReader();

  reader.onload = function (evt) {
    const data = new Uint8Array(evt.target.result);
    workbookCache = XLSX.read(data, { type: 'array' });

    buildSheetTables(workbookCache);
  };

  reader.readAsArrayBuffer(selectedFile);
});

function buildSheetTables(workbook) {
  const container = document.getElementById('tablesContainer');
  container.innerHTML = '';

  const tabsDiv = document.createElement('div');
  tabsDiv.className = 'sheet-tabs';
  container.appendChild(tabsDiv);

  const progressBar = document.getElementById('progressBar');
  const statusText = document.getElementById('statusText');

  const sheetNames = workbook.SheetNames;
  let processed = 0;

  (async function processSheets() {
    for (let index = 0; index < sheetNames.length; index++) {
      const sheetName = sheetNames[index];
      await new Promise(requestAnimationFrame);
  
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });
  
      if (json.length === 0) continue;
  
      const headers = json[0].slice(3).map(h => cleanCell(h));
      const rows = json.slice(1).map(row =>
        row.slice(3).map(cell => {
          if (typeof cell === 'number' && cell > 40000 && cell < 60000) {
            try {
              return formatDate(excelDateToJSDate(cell));
            } catch {
              return cleanCell(cell);
            }
          }
          return cleanCell(cell);
        })
      );
  
      const tableWrapper = document.createElement('div');
      tableWrapper.style.display = index === 0 ? 'block' : 'none';
      tableWrapper.dataset.sheet = sheetName;
  
      const table = document.createElement('table');
      table.className = 'display';
  
      const thead = document.createElement('thead');
      const tr = document.createElement('tr');
      headers.forEach(h => {
        const th = document.createElement('th');
        th.textContent = h;
        tr.appendChild(th);
      });
      thead.appendChild(tr);
      table.appendChild(thead);
  
      const tbody = document.createElement('tbody');
      rows.forEach(r => {
        const rowTr = document.createElement('tr');
        r.forEach(c => {
          const td = document.createElement('td');
          td.textContent = c || '';
          rowTr.appendChild(td);
        });
        tbody.appendChild(rowTr);
      });
      table.appendChild(tbody);
  
      tableWrapper.appendChild(table);
      container.appendChild(tableWrapper);
  
      $(table).DataTable({ pageLength: 25, scrollX: true });
      tablesMap[sheetName] = tableWrapper;
  
      const tab = document.createElement('div');
      tab.className = 'sheet-tab' + (index === 0 ? ' active' : '');
      tab.textContent = sheetName;
      tab.onclick = () => switchSheet(sheetName);
      tabsDiv.appendChild(tab);
  
      processed++;
      const percent = Math.round((processed / sheetNames.length) * 100);
      progressBar.style.width = percent + '%';
    }
  
    statusText.textContent = 'Processing complete';
  })();
}

function switchSheet(sheetName) {
  document.querySelectorAll('.sheet-tab').forEach(tab => {
    tab.classList.toggle('active', tab.textContent === sheetName);
  });

  Object.keys(tablesMap).forEach(name => {
    tablesMap[name].style.display = name === sheetName ? 'block' : 'none';
  });
}



