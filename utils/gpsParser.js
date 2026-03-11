/**
 * Parses a proprietary GPS tracker packet in the format:
 * (IMEI BR DDMMYYYY [AV] DDMM.MMMM[NS] DDDMM.MMMM[EW] SSS.SS HHMMSS CCC.CC ...)
 *
 * Example:
 * (028044674594BR00260311A0026.9101S10035.2144E000.0055843000.0001000000L00000000)
 *
 * Field breakdown after validity marker [A/V]:
 *   - Latitude:  DDMM.MMMM[NS]  (e.g. "0026.9101S")
 *   - Longitude: DDDMM.MMMM[EW] (e.g. "10035.2144E")
 *   - Speed:     NNN.NN (knots)  (e.g. "000.00")
 *   - Time:      HMMSS  (5 digits, no leading zero on hour) (e.g. "55843" = 05:58:43)
 *   - Course:    NNN.NN (degrees) (e.g. "000.00")
 */
export function parse(packet) {
  // Strip surrounding parentheses
  packet = packet.replace(/[()]/g, '').trim();

  if (!packet.includes('BR')) return null;

  try {
    // Extract IMEI (first 12 chars)
    const imei = packet.substring(0, 12);

    // Match all fields: validity, lat, lon, speed(6), time(5), course(6)
    const m = packet.match(
      /([AV])(\d{4}\.\d+[NS])(\d{5}\.\d+[EW])(\d{3}\.\d{2})(\d{5})(\d{3}\.\d{2})/
    );
    if (!m) return null;

    const validity   = m[1];
    const latRaw     = m[2];   // e.g. "0026.9101S"
    const lonRaw     = m[3];   // e.g. "10035.2144E"
    const speedKnots = parseFloat(m[4]);  // e.g. "000.00"
    const timeRaw    = m[5].padStart(6, '0');  // e.g. "55843" → "055843"
    const course     = parseFloat(m[6]);  // e.g. "000.00"

    const latitude   = convertCoordinate(latRaw);
    const longitude  = convertCoordinate(lonRaw);

    // Convert speed from knots to km/h, rounded to 2 decimal places
    const speed = parseFloat((speedKnots * 1.852).toFixed(2));

    // Parse device time from HHMMSS (UTC)
    const hh = parseInt(timeRaw.substring(0, 2));
    const mm = parseInt(timeRaw.substring(2, 4));
    const ss = parseInt(timeRaw.substring(4, 6));
    const deviceTime = new Date();
    deviceTime.setUTCHours(hh, mm, ss, 0);

    return {
      imei,
      valid: validity === 'A',
      latitude,
      longitude,
      speed,
      course,
      deviceTime,
    };
  } catch (err) {
    console.error('[Parser] Error parsing GPS packet:', err.message);
    return null;
  }
}

function convertCoordinate(coord) {
  const direction = coord.slice(-1);           // 'N', 'S', 'E', or 'W'
  const value     = parseFloat(coord.slice(0, -1));

  const degrees = Math.floor(value / 100);
  const minutes = value - degrees * 100;

  let decimal = degrees + minutes / 60;

  if (direction === 'S' || direction === 'W') {
    decimal *= -1;
  }

  return parseFloat(decimal.toFixed(6));
}
