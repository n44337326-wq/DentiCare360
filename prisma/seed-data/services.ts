import type { Service } from "../../src/types";

export type SeedService = Omit<Service, "isActive">;

export const services: SeedService[] = [
  // Dental
  { id: "svc-1", name: "General Dentistry", slug: "general-dentistry", category: "Dental", description: "Routine checkups and oral health maintenance.", durationMinutes: 30, startingPrice: 45, specialtySlug: "dental", suitableSpecialist: "General Dentist" },
  { id: "svc-2", name: "Dental Cleaning", slug: "dental-cleaning", category: "Dental", description: "Professional cleaning to remove plaque and tartar.", durationMinutes: 45, startingPrice: 60, specialtySlug: "dental", suitableSpecialist: "Dental Hygienist" },
  { id: "svc-3", name: "Teeth Whitening", slug: "teeth-whitening", category: "Dental", description: "Safe, effective whitening for a brighter smile.", durationMinutes: 60, startingPrice: 150, specialtySlug: "dental", suitableSpecialist: "Cosmetic Dentist" },
  { id: "svc-4", name: "Root Canal", slug: "root-canal", category: "Dental", description: "Treatment to save an infected or damaged tooth.", durationMinutes: 90, startingPrice: 400, specialtySlug: "dental", suitableSpecialist: "Endodontist" },
  { id: "svc-5", name: "Dental Implants", slug: "dental-implants", category: "Dental", description: "Permanent replacement for missing teeth.", durationMinutes: 120, startingPrice: 1200, specialtySlug: "dental", suitableSpecialist: "Oral Surgeon" },
  { id: "svc-6", name: "Braces", slug: "braces", category: "Dental", description: "Traditional braces for alignment correction.", durationMinutes: 45, startingPrice: 2500, specialtySlug: "dental", suitableSpecialist: "Orthodontist" },
  { id: "svc-7", name: "Clear Aligners", slug: "clear-aligners", category: "Dental", description: "Discreet, removable teeth-straightening system.", durationMinutes: 45, startingPrice: 2800, specialtySlug: "dental", suitableSpecialist: "Orthodontist" },
  { id: "svc-8", name: "Crowns & Bridges", slug: "crowns-bridges", category: "Dental", description: "Restorative options for damaged or missing teeth.", durationMinutes: 90, startingPrice: 500, specialtySlug: "dental", suitableSpecialist: "Prosthodontist" },
  { id: "svc-9", name: "Gum Care", slug: "gum-care", category: "Dental", description: "Treatment for gum disease and gum health maintenance.", durationMinutes: 45, startingPrice: 90, specialtySlug: "dental", suitableSpecialist: "Periodontist" },
  { id: "svc-10", name: "Wisdom Tooth Care", slug: "wisdom-tooth", category: "Dental", description: "Evaluation and extraction of wisdom teeth.", durationMinutes: 60, startingPrice: 250, specialtySlug: "dental", suitableSpecialist: "Oral Surgeon" },
  { id: "svc-11", name: "Pediatric Dentistry", slug: "pediatric-dentistry", category: "Dental", description: "Gentle dental care designed for children.", durationMinutes: 30, startingPrice: 50, specialtySlug: "dental", suitableSpecialist: "Pediatric Dentist" },
  { id: "svc-12", name: "Emergency Dental Care", slug: "emergency-dental", category: "Dental", description: "Urgent care for dental pain, trauma, or infection.", durationMinutes: 30, startingPrice: 80, specialtySlug: "dental", suitableSpecialist: "General Dentist" },

  // Skin & Dermatology
  { id: "svc-13", name: "Acne", slug: "acne", category: "Skin & Dermatology", description: "Assessment and management of acne and breakouts.", durationMinutes: 30, startingPrice: 70, specialtySlug: "dermatology", suitableSpecialist: "Dermatologist" },
  { id: "svc-14", name: "Pigmentation", slug: "pigmentation", category: "Skin & Dermatology", description: "Evaluation of dark spots and uneven skin tone.", durationMinutes: 30, startingPrice: 75, specialtySlug: "dermatology", suitableSpecialist: "Dermatologist" },
  { id: "svc-15", name: "Skin Allergy", slug: "skin-allergy", category: "Skin & Dermatology", description: "Diagnosis and care for rashes and allergic reactions.", durationMinutes: 30, startingPrice: 70, specialtySlug: "dermatology", suitableSpecialist: "Dermatologist" },
  { id: "svc-16", name: "Hair Loss", slug: "hair-loss", category: "Skin & Dermatology", description: "Consultation for hair thinning and hair loss.", durationMinutes: 30, startingPrice: 85, specialtySlug: "dermatology", suitableSpecialist: "Trichologist" },
  { id: "svc-17", name: "Scalp Care", slug: "scalp-care", category: "Skin & Dermatology", description: "Treatment for dandruff and scalp conditions.", durationMinutes: 30, startingPrice: 65, specialtySlug: "dermatology", suitableSpecialist: "Dermatologist" },
  { id: "svc-18", name: "Anti-aging Consultation", slug: "anti-aging", category: "Skin & Dermatology", description: "Personalized consultation for skin aging concerns.", durationMinutes: 45, startingPrice: 100, specialtySlug: "skin-face", suitableSpecialist: "Cosmetic Dermatologist" },
  { id: "svc-19", name: "Skin Health Consultation", slug: "skin-health", category: "Skin & Dermatology", description: "General skin health review and guidance.", durationMinutes: 30, startingPrice: 70, specialtySlug: "skin-face", suitableSpecialist: "Dermatologist" },

  // General Health
  { id: "svc-20", name: "General Physician", slug: "general-physician", category: "General Health", description: "Consultation for everyday health concerns.", durationMinutes: 20, startingPrice: 40, specialtySlug: "general", suitableSpecialist: "General Physician" },
  { id: "svc-21", name: "Preventive Health", slug: "preventive-health", category: "General Health", description: "Screenings and checkups to catch issues early.", durationMinutes: 30, startingPrice: 55, specialtySlug: "preventive", suitableSpecialist: "General Physician" },
  { id: "svc-22", name: "Nutrition", slug: "nutrition", category: "General Health", description: "Personalized dietary and nutrition guidance.", durationMinutes: 30, startingPrice: 45, specialtySlug: "general", suitableSpecialist: "Nutritionist" },
  { id: "svc-23", name: "Women's Health", slug: "womens-health", category: "General Health", description: "Health consultation focused on women's wellbeing.", durationMinutes: 30, startingPrice: 60, specialtySlug: "general", suitableSpecialist: "General Physician" },
  { id: "svc-24", name: "Children's Health", slug: "childrens-health", category: "General Health", description: "Routine and everyday health checks for children.", durationMinutes: 25, startingPrice: 45, specialtySlug: "pediatric", suitableSpecialist: "Pediatrician" },
];
