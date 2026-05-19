import { useNavigate, useLocation } from "react-router-dom";
import tePNGLogo from "../assets/logo.png";
import "../page_styling/appLayout.css";

/**
 * Shared app shell: dark sidebar (logo + nav + logout) and main content column.
 *
 * @param {object} props
 * @param {Array<{ label: string, to?: string, onClick?: () => void }>} props.nav
 *   Sidebar buttons. `to` navigates and drives the active state; `onClick`
 *   overrides navigation (e.g. for dynamic destinations).
 * @param {() => void} [props.onLogout]  Renders the logout button when provided.
 * @param {string} [props.mainClassName]  Extra class on <main> for page-specific styles.
 * @param {React.ReactNode} props.children  Main content.
 *
 * Any other props are forwarded to the outer wrapper (e.g. mouse handlers).
 */
function AppLayout({ nav = [], onLogout, mainClassName = "", className = "", children, ...rest }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className={`app-layout ${className}`.trim()} {...rest}>
      <aside className="app-sidebar">
        <img src={tePNGLogo} alt="Logo" className="app-logo" />

        <nav className="sidebar-nav">
          {nav.map(({ label, to, onClick }) => (
            <button
              key={label}
              type="button"
              onClick={onClick ?? (() => to && navigate(to))}
              className={`sidebar-btn ${to && pathname === to ? "active" : ""}`}
            >
              {label}
            </button>
          ))}
        </nav>

        {onLogout && (
          <button type="button" onClick={onLogout} className="logout-button">
            Logout
          </button>
        )}
      </aside>

      <main className={`app-main ${mainClassName}`.trim()}>{children}</main>
    </div>
  );
}

export default AppLayout;
