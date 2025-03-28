export interface Tutor {
  full_name: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  email?: string;
  subjects?: string[];
  rating?: number;
  sessions_completed?: number;
  profile_image?: string;
  years_experience?: number;
  education_level?: string;
}

export interface SearchParams {
  searchText: string;
  subject?: string;
  availability?: string;
}

export interface TutoringSession {
  session_id: string;
  session_title: string;
  tutor: Tutor;
  subject: string;
  subject_tags: string;
  hourly_rate: number;
  session_format: "online" | "in-person" | "hybrid";
  availability: string[];
  description: string;
  location?: {
    institution_name: string;
    city: string;
    state: string;
    zipcode: string;
  };
  rating?: number;
  reviews_count?: number;
}

// Keep the old type for backward compatibility during transition
export interface PrincipalInvestigator {
  full_name: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  email?: string;
}

export interface ResearchProject {
  project_title: string;
  project_num: string;
  appl_id: string;
  award_amount: number;
  project_start_date: string;
  project_end_date: string;
  abstract_text: string;
  pref_terms: string;
  principal_investigators: PrincipalInvestigator[];
  contact_pi_name: string;
  organization: {
    org_name: string;
    org_city: string;
    org_state: string;
    org_zipcode: string;
  };
} 