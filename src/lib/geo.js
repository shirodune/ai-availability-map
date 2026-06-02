import { geoEqualEarth, geoNaturalEarth1, geoMercator } from "d3-geo";

// Projection factories used by MapView (via @visx/geo CustomProjection).
export const PROJECTIONS = {
  equalEarth: geoEqualEarth,
  naturalEarth: geoNaturalEarth1,
  mercator: geoMercator,
};

export const PROJECTION_LABELS = {
  equalEarth: "Equal Earth",
  naturalEarth: "Natural Earth",
  mercator: "Mercator",
};
