// SVG-based dynamic QR Code generator for queue tokens
function generateTokenQR(tokenString, size = 160) {
  // Generate deterministic binary pattern from token string
  let hash = 0;
  for (let i = 0; i < tokenString.length; i++) {
    hash = (hash << 5) - hash + tokenString.charCodeAt(i);
    hash |= 0;
  }

  const matrixSize = 21;
  const cellSize = size / matrixSize;
  let rects = [];

  // Corner finder patterns (standard 7x7 outer, 3x3 inner)
  const drawFinder = (startX, startY) => {
    // Outer border
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
          rects.push(
            `<rect x="${(startX + c) * cellSize}" y="${(startY + r) * cellSize}" width="${cellSize}" height="${cellSize}" fill="#1e3a8a" rx="${cellSize * 0.2}"/>`
          );
        }
      }
    }
  };

  drawFinder(0, 0); // Top-left
  drawFinder(matrixSize - 7, 0); // Top-right
  drawFinder(0, matrixSize - 7); // Bottom-left

  // Pseudorandom internal data dots based on string hash
  let rng = Math.abs(hash);
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      // Skip finder pattern zones
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= matrixSize - 8;
      const inBottomLeft = r >= matrixSize - 8 && c < 8;

      if (!inTopLeft && !inTopRight && !inBottomLeft) {
        rng = (rng * 9301 + 49297) % 233280;
        const bit = (rng / 233280) > 0.48;
        if (bit) {
          rects.push(
            `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize * 0.9}" height="${cellSize * 0.9}" fill="#1d4ed8" rx="${cellSize * 0.25}"/>`
          );
        }
      }
    }
  }

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" class="mx-auto drop-shadow-sm">
      <rect width="${size}" height="${size}" fill="#ffffff" rx="12"/>
      ${rects.join('')}
    </svg>
  `;
}

window.generateTokenQR = generateTokenQR;

