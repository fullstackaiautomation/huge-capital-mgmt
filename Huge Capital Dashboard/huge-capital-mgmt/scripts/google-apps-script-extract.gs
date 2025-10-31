function dumpAllData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('MCA');

  const range = sheet.getDataRange();
  const data = range.getValues();
  const formulas = range.getFormulas();

  Logger.log('=== SPREADSHEET DUMP ===');
  Logger.log('Rows: ' + data.length + ' | Columns: ' + data[0].length);
  Logger.log('');

  for (let row = 0; row < data.length; row++) {
    for (let col = 0; col < data[row].length; col++) {
      const cellValue = data[row][col];
      const cellFormula = formulas[row][col];

      if (cellValue || cellFormula) {
        const address = getColumnLetter(col) + (row + 1);
        Logger.log(address + ' = ' + cellValue + ' || ' + cellFormula);
      }
    }
  }

  Logger.log('');
  Logger.log('=== END DUMP ===');
}

function getColumnLetter(col) {
  let temp = col;
  let result = '';
  while (temp >= 0) {
    result = String.fromCharCode(65 + (temp % 26)) + result;
    temp = Math.floor(temp / 26) - 1;
  }
  return result;
}
