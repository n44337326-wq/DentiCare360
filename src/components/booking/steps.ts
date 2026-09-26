export interface StepMeta {
  label: string;
  title: string;
  description: string;
}

/** Index 0 is step 1. */
export const STEPS: StepMeta[] = [
  { label: "Service", title: "Choose a service", description: "What would you like to be seen for?" },
  { label: "Specialty", title: "Confirm the specialty", description: "This is the kind of specialist who will look after you." },
  { label: "Doctor", title: "Choose your doctor", description: "Pick who you would like to see." },
  { label: "Date", title: "Pick a date", description: "Days with a green dot have appointments available." },
  { label: "Time", title: "Pick a time", description: "Only open appointment times are shown." },
  { label: "Your details", title: "Your details", description: "Tell us who the visit is for and how you would like to attend." },
  { label: "Confirm", title: "Review and confirm", description: "Check everything before you book." },
];

export const STEP_COUNT = STEPS.length;

export const STEP = {
  service: 1,
  specialty: 2,
  doctor: 3,
  date: 4,
  time: 5,
  details: 6,
  confirm: 7,
} as const;
