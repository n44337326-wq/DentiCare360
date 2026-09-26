import type { DefaultSession } from "next-auth";
import type { Role } from "@/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      doctorId?: string;
      patientId?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    doctorId?: string;
    patientId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    doctorId?: string;
    patientId?: string;
  }
}
