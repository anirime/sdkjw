import { NavLink } from 'react-router-dom';

export function NavBar() {
  return (
    <nav className="nav-bar">
      <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
        구역 목록
      </NavLink>
      <NavLink to="/publishers" className={({ isActive }) => (isActive ? 'active' : '')}>
        배정/담당자
      </NavLink>
    </nav>
  );
}
