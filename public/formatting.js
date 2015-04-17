
function negativePad(numStr) {
  return (numStr[0] === "-") ? numStr : " " + numStr;
}

function zeroPad(num, targetLength) {
  var numStr;
  var pad = "";
  var prefix = "";

  numStr = num.toString();
  if (numStr[0] === "-") {
    prefix = "-";
    numStr = numStr.slice(1);
  }

  padLength = targetLength - numStr.replace(/\D+/, "").length;
  for (i = 0; i < padLength; i++) {
    numStr = "0" + numStr;
  }

  return prefix + numStr;
}
