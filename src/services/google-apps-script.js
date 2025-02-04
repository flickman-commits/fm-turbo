function doGet(e) {
  // Set CORS headers
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  
  // Get the spreadsheet and the first sheet
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheets()[0];
  
  if (e.parameter.action === 'getCount') {
    // Get the count from merged cell F3:G3 (using F3 as the reference cell)
    var count = sheet.getRange('F3').getValue();
    
    var response = {
      status: 'success',
      count: parseInt(count) || 3
    };
    
    output.setContent(JSON.stringify(response));
    return output;
  }
  
  // Handle invalid action
  output.setContent(JSON.stringify({
    status: 'error',
    message: 'Invalid action'
  }));
  return output;
}