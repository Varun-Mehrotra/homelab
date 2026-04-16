export type Category =
  | "Arts"
  | "Family"
  | "Food"
  | "Markets"
  | "Music"
  | "Nightlife"
  | "Sports"
  | "Wellness";

export type CityRegion = "Toronto" | "Etobicoke" | "Mississauga" | "North York" | "Scarborough" | "Vaughan";

export type EventRecord = {
  id: string;
  title: string;
  description: string;
  startTime: string;
  venueName: string;
  addressText: string;
  latitude: number;
  longitude: number;
  contactInfo?: string;
  bookingUrl?: string;
  priceText: string;
  category: Category;
  cityRegion: CityRegion;
  createdAt?: string;
};

export type SearchLocation = {
  label: string;
  latitude: number;
  longitude: number;
};

export type EventSubmission = {
  title: string;
  description: string;
  startTime: string;
  venueName: string;
  addressText: string;
  latitude: number;
  longitude: number;
  contactInfo?: string;
  bookingUrl?: string;
  priceText: string;
  category: Category;
  cityRegion: CityRegion;
};

export const categories: Category[] = ["Arts", "Family", "Food", "Markets", "Music", "Nightlife", "Sports", "Wellness"];

export const torontoRegions: CityRegion[] = ["Toronto", "Etobicoke", "Mississauga", "North York", "Scarborough", "Vaughan"];

export const defaultMapLocation: SearchLocation = {
  label: "Downtown Toronto",
  latitude: 43.6532,
  longitude: -79.3832,
};

export const mapLocations: SearchLocation[] = [
  defaultMapLocation,
  { label: "The Distillery District", latitude: 43.6503, longitude: -79.3596 },
  { label: "High Park", latitude: 43.6465, longitude: -79.4637 },
  { label: "North York Centre", latitude: 43.7687, longitude: -79.4123 },
  { label: "Scarborough Town Centre", latitude: 43.7757, longitude: -79.2578 },
  { label: "Port Credit", latitude: 43.5509, longitude: -79.5859 },
  { label: "Vaughan Metropolitan Centre", latitude: 43.7947, longitude: -79.5272 },
];

export const sampleEvents: EventRecord[] = [
  {
    id: "stackt-night-market",
    title: "STACKT Night Market Social",
    description: "Food vendors, local makers, and an easy first-night-in-town crowd near the waterfront corridor.",
    startTime: "2026-07-03T19:00:00-04:00",
    venueName: "STACKT Market",
    addressText: "28 Bathurst St, Toronto, ON",
    latitude: 43.6426,
    longitude: -79.4012,
    bookingUrl: "https://example.com/stackt-night-market",
    priceText: "Free",
    category: "Markets",
    cityRegion: "Toronto",
  },
  {
    id: "evergreen-summer-yoga",
    title: "Brick Works Summer Yoga",
    description: "A golden-hour outdoor flow session for travelers and locals looking for a slower Toronto evening.",
    startTime: "2026-07-04T18:30:00-04:00",
    venueName: "Evergreen Brick Works",
    addressText: "550 Bayview Ave, Toronto, ON",
    latitude: 43.6843,
    longitude: -79.3647,
    contactInfo: "events@evergreen.ca",
    priceText: "$18",
    category: "Wellness",
    cityRegion: "Toronto",
  },
  {
    id: "kensington-tasting-walk",
    title: "Kensington Market Tasting Walk",
    description: "A compact neighborhood crawl with snacks, stories, and enough local character to anchor a whole afternoon.",
    startTime: "2026-07-05T13:00:00-04:00",
    venueName: "Kensington Market Bell Tower",
    addressText: "197 Augusta Ave, Toronto, ON",
    latitude: 43.6546,
    longitude: -79.4023,
    bookingUrl: "https://example.com/kensington-tasting",
    priceText: "From $42",
    category: "Food",
    cityRegion: "Toronto",
  },
  {
    id: "harbourfront-jazz-night",
    title: "Harbourfront Jazz on the Lake",
    description: "Live jazz and skyline views with room to wander before or after dinner by the water.",
    startTime: "2026-07-06T20:00:00-04:00",
    venueName: "Harbourfront Centre",
    addressText: "235 Queens Quay W, Toronto, ON",
    latitude: 43.6387,
    longitude: -79.3815,
    bookingUrl: "https://example.com/harbourfront-jazz",
    priceText: "$25",
    category: "Music",
    cityRegion: "Toronto",
  },
  {
    id: "bloor-west-family-fair",
    title: "Bloor West Family Street Fair",
    description: "Hands-on demos, pop-up games, and kid-friendly stops for visitors exploring west-end neighborhoods.",
    startTime: "2026-07-07T11:00:00-04:00",
    venueName: "Bloor West Village",
    addressText: "Bloor St W & Jane St, Toronto, ON",
    latitude: 43.6498,
    longitude: -79.4849,
    contactInfo: "hello@bloorwestbia.ca",
    priceText: "Free",
    category: "Family",
    cityRegion: "Etobicoke",
  },
  {
    id: "ago-after-hours",
    title: "AGO After Hours",
    description: "An art-focused late evening with DJs, gallery access, and a built-in downtown start to your night.",
    startTime: "2026-07-08T21:00:00-04:00",
    venueName: "Art Gallery of Ontario",
    addressText: "317 Dundas St W, Toronto, ON",
    latitude: 43.6536,
    longitude: -79.3925,
    bookingUrl: "https://example.com/ago-after-hours",
    priceText: "$35",
    category: "Arts",
    cityRegion: "Toronto",
  },
  {
    id: "celebration-square-watch-party",
    title: "Celebration Square Watch Party",
    description: "Big-screen sports energy with food trucks and enough open space to settle in with friends.",
    startTime: "2026-07-10T19:30:00-04:00",
    venueName: "Mississauga Celebration Square",
    addressText: "300 City Centre Dr, Mississauga, ON",
    latitude: 43.589,
    longitude: -79.6455,
    contactInfo: "events@mississauga.ca",
    priceText: "Free",
    category: "Sports",
    cityRegion: "Mississauga",
  },
  {
    id: "vaughan-speakeasy-tour",
    title: "Vaughan Speakeasy Hop",
    description: "A low-key nightlife circuit for people who want a polished evening without heading downtown.",
    startTime: "2026-07-11T20:30:00-04:00",
    venueName: "VMC Lounge Row",
    addressText: "Interchange Way, Vaughan, ON",
    latitude: 43.7905,
    longitude: -79.5316,
    bookingUrl: "https://example.com/vaughan-speakeasy-hop",
    priceText: "$30",
    category: "Nightlife",
    cityRegion: "Vaughan",
  },
];
