import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { KakaoMap } from '../components/KakaoMap';
import {
  deleteAddress,
  getTerritory,
  listAddressesForTerritory,
  listVisitsForAddress,
  newId,
  putAddress,
  putVisit,
} from '../db';
import { VISIT_RESULT_LABELS, type Address, type Territory, type Visit, type VisitResult } from '../types';

const DEFAULT_CENTER = { lat: 37.5663, lng: 126.9779 }; // Seoul City Hall, fallback

export function TerritoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [territory, setTerritory] = useState<Territory | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | undefined>();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [newAddressText, setNewAddressText] = useState('');
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number } | null>(null);

  const refreshAddresses = useCallback(async () => {
    if (!id) return;
    setAddresses(await listAddressesForTerritory(id));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    getTerritory(id).then((t) => setTerritory(t ?? null));
    refreshAddresses();
  }, [id, refreshAddresses]);

  useEffect(() => {
    if (!selectedAddressId) {
      setVisits([]);
      return;
    }
    listVisitsForAddress(selectedAddressId).then(setVisits);
  }, [selectedAddressId]);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  function handleMapClick(coords: { lat: number; lng: number }) {
    setPendingCoords(coords);
  }

  async function handleAddAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !pendingCoords || !newAddressText.trim()) return;
    const address: Address = {
      id: newId(),
      territoryId: id,
      address: newAddressText.trim(),
      lat: pendingCoords.lat,
      lng: pendingCoords.lng,
    };
    await putAddress(address);
    setNewAddressText('');
    setPendingCoords(null);
    refreshAddresses();
  }

  async function handleDeleteAddress(addressId: string) {
    await deleteAddress(addressId);
    if (selectedAddressId === addressId) setSelectedAddressId(undefined);
    refreshAddresses();
  }

  async function handleAddVisit(result: VisitResult, memo: string) {
    if (!selectedAddressId || !id) return;
    await putVisit({
      id: newId(),
      addressId: selectedAddressId,
      territoryId: id,
      date: new Date().toISOString().slice(0, 10),
      result,
      memo: memo.trim() || undefined,
    });
    setVisits(await listVisitsForAddress(selectedAddressId));
  }

  if (!territory) return <div className="page">불러오는 중...</div>;

  const center = selectedAddress
    ? { lat: selectedAddress.lat, lng: selectedAddress.lng }
    : territory.center ?? (addresses[0] ? { lat: addresses[0].lat, lng: addresses[0].lng } : DEFAULT_CENTER);

  return (
    <div className="page">
      <Link to="/" className="back-link">
        ← 구역 목록
      </Link>
      <h1>
        {territory.number} {territory.name && <span className="territory-name">{territory.name}</span>}
      </h1>

      <KakaoMap
        center={center}
        addresses={addresses}
        selectedAddressId={selectedAddressId}
        onSelectAddress={(a) => setSelectedAddressId(a.id)}
        onMapClick={handleMapClick}
      />

      {pendingCoords && (
        <form className="inline-form" onSubmit={handleAddAddress}>
          <span className="hint">
            선택 좌표: {pendingCoords.lat.toFixed(5)}, {pendingCoords.lng.toFixed(5)}
          </span>
          <input
            placeholder="주소 입력"
            value={newAddressText}
            onChange={(e) => setNewAddressText(e.target.value)}
            autoFocus
          />
          <button type="submit">주소 추가</button>
          <button type="button" onClick={() => setPendingCoords(null)}>
            취소
          </button>
        </form>
      )}
      {!pendingCoords && <p className="hint">지도를 클릭하면 새 주소를 추가할 수 있습니다.</p>}

      <div className="detail-columns">
        <div className="address-column">
          <h2>주소 목록 ({addresses.length})</h2>
          <ul className="address-list">
            {addresses.map((a) => (
              <li key={a.id} className={a.id === selectedAddressId ? 'selected' : ''}>
                <button className="address-select" onClick={() => setSelectedAddressId(a.id)}>
                  {a.address}
                </button>
                <button className="icon-button" onClick={() => handleDeleteAddress(a.id)} aria-label="삭제">
                  삭제
                </button>
              </li>
            ))}
            {addresses.length === 0 && <li className="empty">등록된 주소가 없습니다.</li>}
          </ul>
        </div>

        <div className="visit-column">
          <h2>방문 기록</h2>
          {!selectedAddress && <p className="hint">주소를 선택하면 방문 기록을 관리할 수 있습니다.</p>}
          {selectedAddress && <VisitPanel visits={visits} onAddVisit={handleAddVisit} />}
        </div>
      </div>
    </div>
  );
}

function VisitPanel({
  visits,
  onAddVisit,
}: {
  visits: Visit[];
  onAddVisit: (result: VisitResult, memo: string) => void;
}) {
  const [result, setResult] = useState<VisitResult>('visited');
  const [memo, setMemo] = useState('');

  return (
    <>
      <form
        className="visit-form"
        onSubmit={(e) => {
          e.preventDefault();
          onAddVisit(result, memo);
          setMemo('');
        }}
      >
        <select value={result} onChange={(e) => setResult(e.target.value as VisitResult)}>
          {Object.entries(VISIT_RESULT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input placeholder="메모 (선택)" value={memo} onChange={(e) => setMemo(e.target.value)} />
        <button type="submit">방문 기록 추가</button>
      </form>

      <ul className="visit-list">
        {visits.map((v) => (
          <li key={v.id}>
            <span className="visit-date">{v.date}</span>
            <span className="visit-result">{VISIT_RESULT_LABELS[v.result]}</span>
            {v.memo && <span className="visit-memo">{v.memo}</span>}
          </li>
        ))}
        {visits.length === 0 && <li className="empty">방문 기록이 없습니다.</li>}
      </ul>
    </>
  );
}
