export function parse(packet) {
  packet = packet.replace(/[()]/g, "");

  if (!packet.includes("BR")) return null;

  try {
    const imei = packet.substring(0, 12);

    const match = packet.match(
      /(\\d{4}\\.\\d+[NS])(\\d{5}\\.\\d+[EW])(\\d+\\.\\d+)(\\d+\\.\\d+)/,
    );

    if (!match) return null;

    const latRaw = match[1];
    const lonRaw = match[2];
    const speedRaw = match[3];
    const courseRaw = match[4];

    const latitude = convertCoordinate(latRaw);
    const longitude = convertCoordinate(lonRaw);

    const speed = parseFloat(speedRaw);
    const course = parseFloat(courseRaw);

    return {
      imei,
      latitude,
      longitude,
      speed,
      course,
    };
  } catch (err) {
    return null;
  }
}

function convertCoordinate(coord) {
  const direction = coord.slice(-1);
  const value = parseFloat(coord.slice(0, -1));

  const degrees = Math.floor(value / 100);
  const minutes = value - degrees * 100;

  let decimal = degrees + minutes / 60;

  if (direction === "S" || direction === "W") {
    decimal *= -1;
  }

  return decimal;
}
