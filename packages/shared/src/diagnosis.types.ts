export interface DiagnosisApproach {
  title: string
  rationale: string
  description: string
  first_steps: string[]
}

export interface DiagnosisOutput {
  diagnosis: string
  approaches: DiagnosisApproach[]
}

export interface DiagnosisRequest {
  financialIntention: string
}

export interface DiagnosisResponse {
  diagnosis: string
  approaches: DiagnosisApproach[]
}
