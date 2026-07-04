import { getDB, newId, putAddress, putTerritory } from './db';

/** Seeds one sample territory + address on first run so the map has something to show. */
export async function seedTestDataIfEmpty() {
  const db = await getDB();
  const existing = await db.getAll('territories');
  if (existing.length > 0) return;

  const territoryId = newId();
  await putTerritory({
    id: territoryId,
    number: 'TEST-1',
    name: '테스트 구역',
    memo: '지도/방문기록 테스트용 샘플 구역입니다.',
    center: { lat: 37.5663, lng: 126.9779 },
  });

  await putAddress({
    id: newId(),
    territoryId,
    address: '서울특별시 중구 세종대로 110 (서울특별시청)',
    lat: 37.5663,
    lng: 126.9779,
    memo: '샘플 테스트 주소',
  });
}
