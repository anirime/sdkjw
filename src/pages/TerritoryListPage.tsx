import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listAllAssignments, listTerritories, newId, putTerritory } from '../db';
import type { Territory } from '../types';

export function TerritoryListPage() {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [activeTerritoryIds, setActiveTerritoryIds] = useState<Set<string>>(new Set());
  const [newNumber, setNewNumber] = useState('');
  const [newName, setNewName] = useState('');

  async function refresh() {
    const [territoryList, assignments] = await Promise.all([listTerritories(), listAllAssignments()]);
    territoryList.sort((a, b) => a.number.localeCompare(b.number));
    setTerritories(territoryList);
    setActiveTerritoryIds(new Set(assignments.filter((a) => a.status === 'active').map((a) => a.territoryId)));
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newNumber.trim()) return;
    await putTerritory({ id: newId(), number: newNumber.trim(), name: newName.trim() || undefined });
    setNewNumber('');
    setNewName('');
    refresh();
  }

  return (
    <div className="page">
      <h1>구역 목록</h1>

      <form className="inline-form" onSubmit={handleAdd}>
        <input
          placeholder="구역 번호"
          value={newNumber}
          onChange={(e) => setNewNumber(e.target.value)}
        />
        <input
          placeholder="구역 이름 (선택)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button type="submit">구역 추가</button>
      </form>

      <ul className="territory-list">
        {territories.map((t) => (
          <li key={t.id}>
            <Link to={`/territories/${t.id}`}>
              <span className="territory-number">{t.number}</span>
              {t.name && <span className="territory-name">{t.name}</span>}
              <span className={`badge ${activeTerritoryIds.has(t.id) ? 'badge-active' : 'badge-idle'}`}>
                {activeTerritoryIds.has(t.id) ? '배정중' : '미배정'}
              </span>
            </Link>
          </li>
        ))}
        {territories.length === 0 && <li className="empty">등록된 구역이 없습니다.</li>}
      </ul>
    </div>
  );
}
