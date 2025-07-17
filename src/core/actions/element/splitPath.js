import {
  lineIntersect,
  lineString
} from "@turf/turf";

export class SplitPath {
  static addCutPoints = (multiPoints) => {
    const updatedMultiPoints = [...multiPoints];

    for (let i = 0; i < multiPoints.length; i++) {
      if ([...multiPoints[i]].length < 2) {
        continue;
      }
      const line1 = lineString([...multiPoints[i]]);
      for (let j = i + 1; j < multiPoints.length; j++) {
        if ([...multiPoints[j]].length < 2) {
          continue;
        }
        const line2 = lineString([...multiPoints[j]]);
        // Find intersection points between two lines
        const intersections = lineIntersect(line1, line2);
        if (intersections.features.length > 0) {
          intersections.features.forEach((intersection) => {
            const [x, y] = intersection.geometry.coordinates;

            // Add cut point to each line in multiPoints
            if (
              !multiPoints[i].some((point) => point[0] === x && point[1] === y)
            ) {
              updatedMultiPoints[i].push([x, y]);
              // Sort points in the line to maintain the line order
              updatedMultiPoints[i].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
            }
            if (
              !multiPoints[j].some((point) => point[0] === x && point[1] === y)
            ) {
              updatedMultiPoints[j].push([x, y]);
              // Sort points in the line to maintain the line order
              updatedMultiPoints[j].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
            }
          });
        }
      }
    }

    // @NOTE: Map contains the number of times appearing for each point
    const coordinateCount = new Map();
    let data = updatedMultiPoints;

    data.forEach((segment) => {
      segment.forEach((coord) => {
        const key = JSON.stringify(coord);
        coordinateCount.set(key, (coordinateCount.get(key) || 0) + 1);
      });
    });

    // @NOTE: Filter has more than 1 coordinates and contains at least one coordinates that appear many times
    const filteredData = data.filter(
      (segment) =>
        segment.length > 1 &&
        segment.some(
          (coord) => (coordinateCount.get(JSON.stringify(coord)) || 0) > 1
        )
    );

    return filteredData;
  };
}
