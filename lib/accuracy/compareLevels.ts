/**
 * Level Accuracy Comparison
 * 
 * Compares predicted levels against actual OHLC data to determine accuracy.
 */

export interface LevelResult {
  level: string;      // "R1", "S1", "Master Eject", etc.
  price: number;      // 428
  type: "resistance" | "support" | "eject";
  status: "hit" | "broken" | "not_tested";
  actualPrice?: number; // Closest price to level (high for resistance, low for support)
  distance?: number;    // How close price got to level
  pctDistance?: number; // Distance as percentage of level price
}

interface DayData {
  high: number;
  low: number;
  close: number;
  open: number;
}

interface Level {
  level_name: string;
  price: number;
  type: string; // "above" or "below"
  action?: string;
}

/**
 * Compare predicted levels against actual day data.
 * 
 * Rules:
 * - Resistance: Check if high approached it within tolerance
 * - Support: Check if low approached it within tolerance
 * - Hit: Price came within $0.50 of level
 * - Broken: Price breached level
 * - Not tested: Price didn't approach within tolerance
 */
export function compareLevels(
  levels: Level[],
  dayData: DayData,
  tolerance: number = 0.50
): LevelResult[] {
  return levels.map(level => {
    const isEject = level.level_name.toLowerCase().includes('eject');
    const isResistance = level.type === "above" || level.price > dayData.open;
    const isSupport = level.type === "below" || level.price < dayData.open;
    
    let type: "resistance" | "support" | "eject" = isEject ? "eject" : 
                                                     isResistance ? "resistance" : "support";
    
    if (type === "resistance" || type === "eject") {
      // For resistance, check if high approached it
      const distance = level.price - dayData.high;
      const pctDistance = (distance / level.price) * 100;
      
      if (distance <= tolerance && distance >= 0) {
        // Price came within tolerance - HIT
        return { 
          level: level.level_name, 
          price: level.price, 
          type,
          status: "hit", 
          actualPrice: dayData.high, 
          distance,
          pctDistance
        };
      } else if (dayData.high > level.price) {
        // Price broke through - BROKEN
        return { 
          level: level.level_name, 
          price: level.price, 
          type,
          status: "broken", 
          actualPrice: dayData.high, 
          distance,
          pctDistance
        };
      } else {
        // Price didn't reach - NOT TESTED
        return { 
          level: level.level_name, 
          price: level.price, 
          type,
          status: "not_tested", 
          actualPrice: dayData.high,
          distance,
          pctDistance
        };
      }
    } else {
      // For support, check if low approached it
      const distance = dayData.low - level.price;
      const pctDistance = (distance / level.price) * 100;
      
      if (Math.abs(distance) <= tolerance && distance <= 0) {
        // Price came within tolerance from below - HIT
        return { 
          level: level.level_name, 
          price: level.price, 
          type,
          status: "hit", 
          actualPrice: dayData.low, 
          distance: Math.abs(distance),
          pctDistance
        };
      } else if (dayData.low < level.price) {
        // Price broke through - BROKEN
        return { 
          level: level.level_name, 
          price: level.price, 
          type,
          status: "broken", 
          actualPrice: dayData.low, 
          distance: Math.abs(distance),
          pctDistance
        };
      } else {
        // Price didn't reach - NOT TESTED
        return { 
          level: level.level_name, 
          price: level.price, 
          type,
          status: "not_tested", 
          actualPrice: dayData.low,
          distance: Math.abs(distance),
          pctDistance
        };
      }
    }
  });
}

/**
 * Calculate overall accuracy percentage.
 */
export function calculateAccuracy(results: LevelResult[]): {
  total: number;
  hit: number;
  broken: number;
  notTested: number;
  percentage: number;
} {
  const total = results.length;
  const hit = results.filter(r => r.status === "hit").length;
  const broken = results.filter(r => r.status === "broken").length;
  const notTested = results.filter(r => r.status === "not_tested").length;
  
  // Accuracy = (hits + not tested) / total
  // We don't penalize for levels not tested, only for broken levels
  const accurate = hit + notTested;
  const percentage = total > 0 ? (accurate / total) * 100 : 0;
  
  return {
    total,
    hit,
    broken,
    notTested,
    percentage
  };
}
