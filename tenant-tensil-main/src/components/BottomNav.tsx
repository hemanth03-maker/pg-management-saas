import { Home, BedDouble, Users, CreditCard, Receipt } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const tabs = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/rooms", icon: BedDouble, label: "Rooms" },
  { path: "/members", icon: Users, label: "Members" },
  { path: "/payments", icon: CreditCard, label: "Payments" },
  { path: "/expenses", icon: Receipt, label: "Expenses" },
];

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-pb shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map(tab => {
          const active = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-1 py-2.5 px-3 min-w-[64px] transition-all active:scale-95 ${
                active
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <div className={`p-1 rounded-lg transition-colors ${active ? "bg-primary/10" : ""}`}>
                <tab.icon size={24} strokeWidth={active ? 2.5 : 2} />
              </div>
              <span className={`text-[11px] font-semibold ${active ? "text-primary" : ""}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
