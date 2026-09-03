import type { Place } from "@/lib/types";

export const PLACES: Place[] = [
  {
    id: "chennai",
    name: "Chennai",
    label: "Chennai — Nandanam / GST start",
    city: "Chennai",
    latitude: 13.0524,
    longitude: 80.2501,
    kind: "city",
  },
  {
    id: "t-nagar",
    name: "T. Nagar",
    label: "T. Nagar, Chennai",
    city: "Chennai",
    latitude: 13.0418,
    longitude: 80.2337,
    kind: "landmark",
  },
  {
    id: "guindy",
    name: "Guindy",
    label: "Guindy, Chennai",
    city: "Chennai",
    latitude: 13.0067,
    longitude: 80.2206,
    kind: "junction",
  },
  {
    id: "airport",
    name: "Chennai Airport",
    label: "Chennai International Airport",
    city: "Chennai",
    latitude: 12.9941,
    longitude: 80.1707,
    kind: "landmark",
  },
  {
    id: "adyar",
    name: "Adyar",
    label: "Adyar, Chennai",
    city: "Chennai",
    latitude: 13.0063,
    longitude: 80.2574,
    kind: "landmark",
  },
  {
    id: "velachery",
    name: "Velachery",
    label: "Velachery, Chennai",
    city: "Chennai",
    latitude: 12.9758,
    longitude: 80.221,
    kind: "landmark",
  },
  {
    id: "tambaram",
    name: "Tambaram",
    label: "Tambaram, GST Road",
    city: "Tambaram",
    latitude: 12.9249,
    longitude: 80.1,
    kind: "city",
  },
  {
    id: "vandalur",
    name: "Vandalur",
    label: "Vandalur Zoo / GST",
    city: "Vandalur",
    latitude: 12.8913,
    longitude: 80.081,
    kind: "landmark",
  },
  {
    id: "guduvancheri",
    name: "Guduvancheri",
    label: "Guduvancheri, GST Road",
    city: "Guduvancheri",
    latitude: 12.8456,
    longitude: 80.0603,
    kind: "city",
  },
  {
    id: "srm",
    name: "SRM Kattankulathur",
    label: "SRM Institute, Kattankulathur",
    city: "Kattankulathur",
    latitude: 12.823,
    longitude: 80.044,
    kind: "landmark",
  },
  {
    id: "mm-nagar",
    name: "Maraimalai Nagar",
    label: "Maraimalai Nagar / SIPCOT",
    city: "Maraimalai Nagar",
    latitude: 12.791,
    longitude: 80.018,
    kind: "city",
  },
  {
    id: "chengalpattu",
    name: "Chengalpattu",
    label: "Chengalpattu",
    city: "Chengalpattu",
    latitude: 12.6819,
    longitude: 79.9832,
    kind: "city",
  },
  {
    id: "sholinganallur",
    name: "Sholinganallur",
    label: "Sholinganallur, OMR",
    city: "Chennai",
    latitude: 12.9009,
    longitude: 80.2279,
    kind: "landmark",
  },
  {
    id: "porur",
    name: "Porur",
    label: "Porur Junction",
    city: "Chennai",
    latitude: 13.034,
    longitude: 80.156,
    kind: "junction",
  },
  {
    id: "kanchipuram",
    name: "Kanchipuram",
    label: "Kanchipuram",
    city: "Kanchipuram",
    latitude: 12.8342,
    longitude: 79.7036,
    kind: "city",
  },
  {
    id: "trichy",
    name: "Tiruchirappalli",
    label: "Trichy (Tiruchirappalli)",
    city: "Tiruchirappalli",
    latitude: 10.7905,
    longitude: 78.7047,
    kind: "city",
  },
  {
    id: "thanjavur",
    name: "Thanjavur",
    label: "Thanjavur",
    city: "Thanjavur",
    latitude: 10.787,
    longitude: 79.1378,
    kind: "city",
  },
  {
    id: "madurai",
    name: "Madurai",
    label: "Madurai",
    city: "Madurai",
    latitude: 9.9252,
    longitude: 78.1198,
    kind: "city",
  },
  {
    id: "tirunelveli",
    name: "Tirunelveli",
    label: "Tirunelveli",
    city: "Tirunelveli",
    latitude: 8.7139,
    longitude: 77.7567,
    kind: "city",
  },
  {
    id: "kanyakumari",
    name: "Kanyakumari",
    label: "Kanyakumari",
    city: "Kanyakumari",
    latitude: 8.0883,
    longitude: 77.5385,
    kind: "city",
  },
  {
    id: "coimbatore",
    name: "Coimbatore",
    label: "Coimbatore",
    city: "Coimbatore",
    latitude: 11.0168,
    longitude: 76.9558,
    kind: "city",
  },
  {
    id: "salem",
    name: "Salem",
    label: "Salem",
    city: "Salem",
    latitude: 11.6643,
    longitude: 78.146,
    kind: "city",
  },
  {
    id: "bengaluru",
    name: "Bengaluru",
    label: "Bengaluru",
    city: "Bengaluru",
    latitude: 12.9716,
    longitude: 77.5946,
    kind: "city",
  },
  {
    id: "puducherry",
    name: "Puducherry",
    label: "Puducherry",
    city: "Puducherry",
    latitude: 11.9344,
    longitude: 79.8301,
    kind: "city",
  },
];

export function getPlace(id: string): Place | undefined {
  if (!id) return undefined;
  if (id.startsWith("custom:")) {
    // Format: custom:<lat>,<lng>[:<url-encoded label>].
    // The label suffix is optional so older custom IDs still resolve.
    const rest = id.slice("custom:".length);
    const [coordsPart, ...labelParts] = rest.split(":");
    const [latStr, lngStr] = coordsPart.split(",");

    const latitude = Number(latStr);
    const longitude = Number(lngStr);

    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      const encodedLabel = labelParts.join(":");

      let name = "Current Location";

      if (encodedLabel) {
        try {
          name = decodeURIComponent(encodedLabel);
        } catch {
          // Malformed encoding — keep the generic fallback.
        }
      }

      return {
        id,
        name,
        label: name,
        city: name,
        latitude,
        longitude,
        kind: "landmark",
      };
    }

    return undefined;
  }

  const clean = id.trim().toLowerCase();
  return PLACES.find(
    (p) =>
      p.id.toLowerCase() === clean ||
      p.name.toLowerCase() === clean ||
      p.city.toLowerCase() === clean,
  );
}

/**
 * Search the seeded place catalogue.
 *
 * The API uses this for user-entered place queries.
 * Matching is intentionally simple and deterministic so the
 * simulation does not depend on an external search service.
 */
export function searchPlaces(query: string): Place[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return PLACES;
  }

  return PLACES.filter((place) => {
    const searchableText = [
      place.id,
      place.name,
      place.label,
      place.city,
      place.kind,
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedQuery);
  });
}