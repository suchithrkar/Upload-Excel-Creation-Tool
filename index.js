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
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (evt) {
    const data = new Uint8Array(evt.target.result);
    const workbook = XLSX.read(data, { type: 'array' });

    const container = document.getElementById('tablesContainer');
    container.innerHTML = '';

    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });

      if (json.length === 0) return;

      const headers = json[0].map(h => cleanCell(h));
      const rows = json.slice(1).map(row => row.map(cell => {
        if (typeof cell === 'number' && cell > 40000 && cell < 60000) {
          try {
            return formatDate(excelDateToJSDate(cell));
          } catch {
            return cleanCell(cell);
          }
        }
        return cleanCell(cell);
      }));

      const block = document.createElement('div');
      block.className = 'sheet-block';

      const title = document.createElement('div');
      title.className = 'sheet-title';
      title.textContent = `Sheet: ${sheetName}`;
      block.appendChild(title);

      const table = document.createElement('table');
      table.className = 'display';

      const thead = document.createElement('thead');
      const headRow = document.createElement('tr');
      headers.forEach(h => {
        const th = document.createElement('th');
        th.textContent = h;
        headRow.appendChild(th);
      });
      thead.appendChild(headRow);
      table.appendChild(thead);

      const tbody = document.createElement('tbody');
      rows.forEach(r => {
        const tr = document.createElement('tr');
        headers.forEach((_, idx) => {
          const td = document.createElement('td');
          td.textContent = r[idx] || '';
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);

      block.appendChild(table);
      container.appendChild(block);

      $(table).DataTable({
        pageLength: 25,
        scrollX: true
      });
    });
  };

  reader.readAsArrayBuffer(file);
});
