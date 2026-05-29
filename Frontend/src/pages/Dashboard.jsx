import AppLayout from "../Components/AppLayout";
import "../page_styling/dashboard.css";

const NAV = [
  { label: "📂 Projects", to: "/app/projects" },
  { label: "📊 Storage Calculator", to: "/app/calculator" },
  { label: "🔋 UPS Calculator", to: "/app/ups" },
];

/*
The Dashboard component is the landing page after login. It uses the shared
AppLayout shell to display the sidebar navigation (Projects, Storage Calculator,
UPS Calculator) and a welcome message in the main content area.
*/
function Dashboard({ onLogout }) {
  return (
    <AppLayout nav={NAV} onLogout={onLogout} mainClassName="dashboard-main">
      <section className="dashboard-content">
        <h1>Welcome to the CCTV Design Tool</h1>
        <p>Select an option from the side menu to begin.</p>
      </section>
    </AppLayout>
  );
}

export default Dashboard;
