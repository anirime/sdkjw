export interface Publisher {
  id: string;
  name: string;
  phone?: string;
}

export interface Territory {
  id: string;
  number: string;
  name?: string;
  memo?: string;
  /** Rough center point for the map, in Kakao Maps (lat, lng) form. */
  center?: { lat: number; lng: number };
}

export type VisitResult = 'visited' | 'not_home' | 'refused' | 'do_not_call' | 'callback';

export const VISIT_RESULT_LABELS: Record<VisitResult, string> = {
  visited: '방문함',
  not_home: '부재중',
  refused: '거절',
  do_not_call: '방문 사절',
  callback: '재방문 요망',
};

export interface Address {
  id: string;
  territoryId: string;
  address: string;
  lat: number;
  lng: number;
  memo?: string;
}

export interface Visit {
  id: string;
  addressId: string;
  territoryId: string;
  date: string; // ISO date string
  result: VisitResult;
  memo?: string;
}

export type AssignmentStatus = 'active' | 'completed';

export interface Assignment {
  id: string;
  territoryId: string;
  publisherId: string;
  assignedDate: string; // ISO date string
  returnedDate?: string; // ISO date string
  status: AssignmentStatus;
}
