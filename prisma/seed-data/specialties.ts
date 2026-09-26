import type { Specialty } from "../../src/types";

export const specialties: Specialty[] = [
  {
    id: "sp-dental",
    name: "Dental Care",
    slug: "dental",
    description: "Comprehensive dentistry from cleanings to implants.",
    icon: "Smile",
  },
  {
    id: "sp-derm",
    name: "Dermatology",
    slug: "dermatology",
    description: "Skin health, acne, and pigmentation care.",
    icon: "Sparkles",
  },
  {
    id: "sp-face",
    name: "Skin & Face",
    slug: "skin-face",
    description: "Cosmetic consultation and anti-aging care.",
    icon: "ScanFace",
  },
  {
    id: "sp-general",
    name: "General Physician",
    slug: "general",
    description: "Everyday health concerns and preventive care.",
    icon: "Stethoscope",
  },
  {
    id: "sp-pediatric",
    name: "Pediatric Care",
    slug: "pediatric",
    description: "Health care designed for children.",
    icon: "Baby",
  },
  {
    id: "sp-preventive",
    name: "Preventive Care",
    slug: "preventive",
    description: "Screenings and checkups to stay ahead of illness.",
    icon: "ShieldCheck",
  },
];
