module.exports = function stringToAsciiByteArray(str) {
  var bytes = [];
  for (var i = 0; i < str.length; ++i) {
    var charCode = str.charCodeAt(i);
    if (charCode > 0xFF)  // char > 1 byte since charCodeAt returns the UTF-16 value
    {
      throw new Error('Character ' + String.fromCharCode(charCode) + ' can\'t be represented by a US-ASCII byte.');
    }
    bytes.push(charCode);
  }
  return bytes;
}
function stringToUtf16ByteArray(str) {
  var bytes = [];
  //currently the function returns without BOM. Uncomment the next line to change that.
  //bytes.push(254, 255);  //Big Endian Byte Order Marks
  for (var i = 0; i < str.length; ++i) {
    var charCode = str.charCodeAt(i);
    //char > 2 bytes is impossible since charCodeAt can only return 2 bytes
    bytes.push((charCode & 0xFF00) >>> 8);  //high byte (might be 0)
    bytes.push(charCode & 0xFF);  //low byte
  }
  return bytes;
}
function stringToUtf32ByteArray(str) {
  var bytes = [];
  //currently the function returns without BOM. Uncomment the next line to change that.
  //bytes.push(0, 0, 254, 255);  //Big Endian Byte Order Marks
  for (var i = 0; i < str.length; i += 2) {
    var charPoint = str.codePointAt(i);
    //char > 4 bytes is impossible since codePointAt can only return 4 bytes
    bytes.push((charPoint & 0xFF000000) >>> 24);
    bytes.push((charPoint & 0xFF0000) >>> 16);
    bytes.push((charPoint & 0xFF00) >>> 8);
    bytes.push(charPoint & 0xFF);
  }
  return bytes;
}
