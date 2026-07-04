import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Address, Assignment, Publisher, Territory, Visit } from './types';

interface TerritoryCardDB extends DBSchema {
  territories: {
    key: string;
    value: Territory;
  };
  addresses: {
    key: string;
    value: Address;
    indexes: { territoryId: string };
  };
  visits: {
    key: string;
    value: Visit;
    indexes: { addressId: string; territoryId: string };
  };
  publishers: {
    key: string;
    value: Publisher;
  };
  assignments: {
    key: string;
    value: Assignment;
    indexes: { territoryId: string; publisherId: string };
  };
}

let dbPromise: Promise<IDBPDatabase<TerritoryCardDB>> | undefined;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<TerritoryCardDB>('territory-card-db', 1, {
      upgrade(db) {
        db.createObjectStore('territories', { keyPath: 'id' });

        const addresses = db.createObjectStore('addresses', { keyPath: 'id' });
        addresses.createIndex('territoryId', 'territoryId');

        const visits = db.createObjectStore('visits', { keyPath: 'id' });
        visits.createIndex('addressId', 'addressId');
        visits.createIndex('territoryId', 'territoryId');

        db.createObjectStore('publishers', { keyPath: 'id' });

        const assignments = db.createObjectStore('assignments', { keyPath: 'id' });
        assignments.createIndex('territoryId', 'territoryId');
        assignments.createIndex('publisherId', 'publisherId');
      },
    });
  }
  return dbPromise;
}

export function newId() {
  return crypto.randomUUID();
}

// Territories
export async function listTerritories() {
  return (await getDB()).getAll('territories');
}
export async function getTerritory(id: string) {
  return (await getDB()).get('territories', id);
}
export async function putTerritory(territory: Territory) {
  await (await getDB()).put('territories', territory);
}
export async function deleteTerritory(id: string) {
  const db = await getDB();
  const tx = db.transaction(['territories', 'addresses', 'visits', 'assignments'], 'readwrite');
  await tx.objectStore('territories').delete(id);
  const addressIds: string[] = [];
  for (const addr of await tx.objectStore('addresses').index('territoryId').getAll(id)) {
    addressIds.push(addr.id);
    await tx.objectStore('addresses').delete(addr.id);
  }
  for (const visit of await tx.objectStore('visits').index('territoryId').getAll(id)) {
    await tx.objectStore('visits').delete(visit.id);
  }
  for (const assignment of await tx.objectStore('assignments').index('territoryId').getAll(id)) {
    await tx.objectStore('assignments').delete(assignment.id);
  }
  await tx.done;
}

// Addresses
export async function listAddressesForTerritory(territoryId: string) {
  return (await getDB()).getAllFromIndex('addresses', 'territoryId', territoryId);
}
export async function putAddress(address: Address) {
  await (await getDB()).put('addresses', address);
}
export async function deleteAddress(id: string) {
  const db = await getDB();
  const tx = db.transaction(['addresses', 'visits'], 'readwrite');
  await tx.objectStore('addresses').delete(id);
  for (const visit of await tx.objectStore('visits').index('addressId').getAll(id)) {
    await tx.objectStore('visits').delete(visit.id);
  }
  await tx.done;
}

// Visits
export async function listVisitsForAddress(addressId: string) {
  const visits = await (await getDB()).getAllFromIndex('visits', 'addressId', addressId);
  return visits.sort((a, b) => b.date.localeCompare(a.date));
}
export async function putVisit(visit: Visit) {
  await (await getDB()).put('visits', visit);
}
export async function deleteVisit(id: string) {
  await (await getDB()).delete('visits', id);
}

// Publishers
export async function listPublishers() {
  return (await getDB()).getAll('publishers');
}
export async function putPublisher(publisher: Publisher) {
  await (await getDB()).put('publishers', publisher);
}
export async function deletePublisher(id: string) {
  await (await getDB()).delete('publishers', id);
}

// Assignments
export async function listAssignmentsForTerritory(territoryId: string) {
  const assignments = await (await getDB()).getAllFromIndex('assignments', 'territoryId', territoryId);
  return assignments.sort((a, b) => b.assignedDate.localeCompare(a.assignedDate));
}
export async function listAllAssignments() {
  return (await getDB()).getAll('assignments');
}
export async function putAssignment(assignment: Assignment) {
  await (await getDB()).put('assignments', assignment);
}
