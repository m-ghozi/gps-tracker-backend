/**
 * Parses a proprietary GPS tracker packet in the format:
 * (IMEI BR [DATE_INFO] [AV] DDMM.MMMM[NS] DDDMM.MMMM[EW] SSS.SS HHMMSS CCC.CC ...)
 *
 * Example:
 * (028044674594BR00260311A0026.9101S10035.2144E000.0055843000.0001000000L00000000)
 */
export function parse(packet) {
  // Strip surrounding parentheses
  packet = packet.replace(/[()]/g, '').trim();

  if (!packet.includes('BR')) return null;

  try {
    // 1. Extract IMEI by splitting at 'BR'
    const parts = packet.split('BR');
    const imei = parts[0]; 
    const afterBR = parts[1]; // e.g. "00260311A0026..."

    // 2. Extract Date from the first 8 characters after 'BR'
    // Format is likely: [Ignored 2 digits][YY][MM][DD]
    // In "00260311", 26=Year, 03=Month, 11=Day
    const datePart = afterBR.substring(2, 8); // "260311"
    const year = 2000 + parseInt(datePart.substring(0, 2));
    const month = parseInt(datePart.substring(2, 4)) - 1; // JS Month is 0-indexed
    const day = parseInt(datePart.substring(4, 6));

    // 3. Match GPS fields: validity, lat, lon, speed, time, course
    const m = afterBR.match(
      /([AV])(\d{4}\.\d+[NS])(\d{5}\.\d+[EW])(\d{3}\.\d{2})(\d{5})(\d{3}\.\d{2})/
    );
    if (!m) return null;

    const validity   = m[1];
    const latRaw     = m[2];   
    const lonRaw     = m[3];   
    const speedKnots = parseFloat(m[4]);  
    const timeRaw    = m[5].padStart(6, '0');  // "55843" -> "055843"
    const course     = parseFloat(m[6]);  

    const latitude   = convertCoordinate(latRaw);
    const longitude  = convertCoordinate(lonRaw);

    // Convert speed from knots to km/h
    const speed = parseFloat((speedKnots * 1.852).toFixed(2));

    // 4. Parse device time from HHMMSS (UTC) using the date from the packet
    const hh = parseInt(timeRaw.substring(0, 2));
    const mm = parseInt(timeRaw.substring(2, 4));
    const ss = parseInt(timeRaw.substring(4, 6));
    
    // Create Date object in UTC
    const deviceTime = new Date(Date.UTC(year, month, day, hh, mm, ss));

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
  const direction = coord.slice(-1);          
  const value     = parseFloat(coord.slice(0, -1));

  const degrees = Math.floor(value / 100);
  const minutes = value - degrees * 100;

  let decimal = degrees + minutes / 60;

  if (direction === 'S' || direction === 'W') {
    decimal *= -1;
  }

  return parseFloat(decimal.toFixed(6));
}
