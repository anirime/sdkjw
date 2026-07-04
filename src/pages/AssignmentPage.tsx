import { useEffect, useState } from 'react';
import {
  deletePublisher,
  listAllAssignments,
  listPublishers,
  listTerritories,
  newId,
  putAssignment,
  putPublisher,
} from '../db';
import type { Assignment, Publisher, Territory } from '../types';

export function AssignmentPage() {
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [newPublisherName, setNewPublisherName] = useState('');
  const [assignTerritoryId, setAssignTerritoryId] = useState('');
  const [assignPublisherId, setAssignPublisherId] = useState('');

  async function refresh() {
    const [p, t, a] = await Promise.all([listPublishers(), listTerritories(), listAllAssignments()]);
    p.sort((a1, b1) => a1.name.localeCompare(b1.name));
    t.sort((a1, b1) => a1.number.localeCompare(b1.number));
    setPublishers(p);
    setTerritories(t);
    setAssignments(a.sort((a1, b1) => b1.assignedDate.localeCompare(a1.assignedDate)));
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleAddPublisher(e: React.FormEvent) {
    e.preventDefault();
    if (!newPublisherName.trim()) return;
    await putPublisher({ id: newId(), name: newPublisherName.trim() });
    setNewPublisherName('');
    refresh();
  }

  async function handleDeletePublisher(id: string) {
    await deletePublisher(id);
    refresh();
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!assignTerritoryId || !assignPublisherId) return;
    await putAssignment({
      id: newId(),
      territoryId: assignTerritoryId,
      publisherId: assignPublisherId,
      assignedDate: new Date().toISOString().slice(0, 10),
      status: 'active',
    });
    setAssignTerritoryId('');
    setAssignPublisherId('');
    refresh();
  }

  async function handleReturn(assignment: Assignment) {
    await putAssignment({
      ...assignment,
      status: 'completed',
      returnedDate: new Date().toISOString().slice(0, 10),
    });
    refresh();
  }

  const territoryById = new Map(territories.map((t) => [t.id, t]));
  const publisherById = new Map(publishers.map((p) => [p.id, p]));
  const assignedTerritoryIds = new Set(assignments.filter((a) => a.status === 'active').map((a) => a.territoryId));
  const availableTerritories = territories.filter((t) => !assignedTerritoryIds.has(t.id));

  return (
    <div className="page">
      <h1>배정 / 담당자 관리</h1>

      <section>
        <h2>담당자</h2>
        <form className="inline-form" onSubmit={handleAddPublisher}>
          <input
            placeholder="담당자 이름"
            value={newPublisherName}
            onChange={(e) => setNewPublisherName(e.target.value)}
          />
          <button type="submit">담당자 추가</button>
        </form>
        <ul className="publisher-list">
          {publishers.map((p) => (
            <li key={p.id}>
              {p.name}
              <button className="icon-button" onClick={() => handleDeletePublisher(p.id)}>
                삭제
              </button>
            </li>
          ))}
          {publishers.length === 0 && <li className="empty">등록된 담당자가 없습니다.</li>}
        </ul>
      </section>

      <section>
        <h2>구역 배정</h2>
        <form className="inline-form" onSubmit={handleAssign}>
          <select value={assignTerritoryId} onChange={(e) => setAssignTerritoryId(e.target.value)}>
            <option value="">구역 선택</option>
            {availableTerritories.map((t) => (
              <option key={t.id} value={t.id}>
                {t.number} {t.name ?? ''}
              </option>
            ))}
          </select>
          <select value={assignPublisherId} onChange={(e) => setAssignPublisherId(e.target.value)}>
            <option value="">담당자 선택</option>
            {publishers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button type="submit" disabled={!assignTerritoryId || !assignPublisherId}>
            배정하기
          </button>
        </form>
      </section>

      <section>
        <h2>배정 이력</h2>
        <ul className="assignment-list">
          {assignments.map((a) => (
            <li key={a.id}>
              <span className="territory-number">{territoryById.get(a.territoryId)?.number ?? '(삭제됨)'}</span>
              <span>{publisherById.get(a.publisherId)?.name ?? '(삭제됨)'}</span>
              <span className="hint">{a.assignedDate}</span>
              {a.status === 'active' ? (
                <>
                  <span className="badge badge-active">배정중</span>
                  <button className="icon-button" onClick={() => handleReturn(a)}>
                    반납 처리
                  </button>
                </>
              ) : (
                <span className="badge badge-idle">반납됨 ({a.returnedDate})</span>
              )}
            </li>
          ))}
          {assignments.length === 0 && <li className="empty">배정 이력이 없습니다.</li>}
        </ul>
      </section>
    </div>
  );
}
