import type { MediaAsset } from "@/lib/signage-data";
import dessert from "@/assets/media-dessert.jpg";
import skewers from "@/assets/media-skewers.jpg";
import pizza from "@/assets/media-pizza.jpg";
import bakery from "@/assets/media-bakery.jpg";
import board from "@/assets/now-playing.jpg";

export const mediaAssets: MediaAsset[] = [
  { id: "m1", name: "Jollof Special Offer", brandId: "kilimanjaro", kind: "Image", approval: "Approved", duration: "00:15", image: board },
  { id: "m2", name: "Suya Nights 15s", brandId: "kilimanjaro", kind: "Video", approval: "Pending", duration: "00:15", image: skewers },
  { id: "m3", name: "Creamy Sundae", brandId: "kilimanjaro", kind: "Image", approval: "Approved", duration: "00:10", image: dessert },
  { id: "m4", name: "Fresh Bread Daily", brandId: "kilimanjaro", kind: "Image", approval: "Rejected", duration: "00:10", image: bakery },
  { id: "m5", name: "Two-For-Tuesday Hero", brandId: "pizza-jungle", kind: "Video", approval: "Approved", duration: "00:15", image: pizza },
  { id: "m6", name: "Pizza Menu Board", brandId: "pizza-jungle", kind: "Image", approval: "Pending", duration: "00:20", image: pizza },
  { id: "m7", name: "Grill Combo Loop", brandId: "killi-grill", kind: "Video", approval: "Approved", duration: "00:12", image: skewers },
  { id: "m8", name: "Cold Rush Sundae", brandId: "nibbles-creamy", kind: "Image", approval: "Approved", duration: "00:10", image: dessert },
  { id: "m9", name: "Bakery Counter", brandId: "nibbles-bakery", kind: "Image", approval: "Pending", duration: "00:10", image: bakery },
];
