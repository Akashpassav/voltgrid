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
];

export function getPlace(id: string): Place | undefined {
  if (id.startsWith("custom:")) {
    const [latStr, lngStr] = id.slice("custom:".length).split(",");
    const latitude = Number(latStr);
    const longitude = Number(lngStr);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      return {
        id,
        name: "Current Location",
        label: "Current Location",
        city: "Current Location",
        latitude,
        longitude,
        kind: "landmark",
      };
    }
    return undefined;
  }
  return PLACES.find((p) => p.id === id);
}