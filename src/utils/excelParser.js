import * as XLSX from 'xlsx';

export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (rawData.length < 3) {
          throw new Error('File does not have the expected structure. Need at least 3 rows (month row, week row, data rows).');
        }

        const monthRow = rawData[0] || [];
        const weekRow = rawData[1] || [];

        const weekColumns = [];
        let currentMonth = '';
        const maxCol = Math.max(monthRow.length, weekRow.length);

        for (let col = 8; col < maxCol; col++) {
          const monthVal = String(monthRow[col] || '').trim();
          const weekVal = String(weekRow[col] || '').trim();
          if (monthVal) currentMonth = monthVal;
          if (weekVal) {
            const weekNumber = parseInt(weekVal.replace(/[^0-9]/g, ''), 10) || 0;
            weekColumns.push({
              colIndex: col,
              month: currentMonth,
              weekLabel: weekVal,
              weekNumber,
              displayLabel: currentMonth ? `${currentMonth} – ${weekVal}` : weekVal,
            });
          }
        }

        if (weekColumns.length === 0) {
          throw new Error('No week columns found starting at column I. Please verify the file format.');
        }

        const projects = [];
        for (let row = 2; row < rawData.length; row++) {
          const rowData = rawData[row];
          const projectName = String(rowData[2] || '').trim();
          if (!projectName) continue;

          projects.push({
            gdlName: String(rowData[0] || '').trim(),
            accountName: String(rowData[1] || '').trim(),
            projectName,
            daName: String(rowData[4] || '').trim(),
            frequency: String(rowData[6] || '').trim(),
            status: String(rowData[7] || '').trim().toUpperCase(),
            weekValues: weekColumns.map((wc) => ({
              colIndex: wc.colIndex,
              value: String(rowData[wc.colIndex] || '').trim().toUpperCase(),
            })),
          });
        }

        if (projects.length === 0) {
          throw new Error('No project data found. Rows with data must start from row 3 with a project name in column C.');
        }

        resolve({ projects, weekColumns });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read the file. Please try again.'));
    reader.readAsArrayBuffer(file);
  });
}
