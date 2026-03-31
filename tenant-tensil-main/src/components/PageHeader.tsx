import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/context/AuthContext";
import { LogOut, Settings } from "lucide-react";
import { useState } from "react";
import { useSettings } from "@/context/SettingsContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export const PageHeader = ({ title, subtitle }: PageHeaderProps) => {
  const { signOut } = useAuth();
  const { pgName, setPgName } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [nameInput, setNameInput] = useState(pgName);

  const handleSave = () => {
    setPgName(nameInput.trim() || "My PG");
    setSettingsOpen(false);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setNameInput(pgName); setSettingsOpen(true); }}
            className="p-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
            title="Settings"
          >
            <Settings size={18} />
          </button>
          <ThemeToggle />
          <button
            onClick={signOut}
            className="p-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-[90vw] md:max-w-sm rounded-lg">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>Customize your PG details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">PG Name</label>
              <Input
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                placeholder="Enter your PG name"
                className="h-12 text-base"
              />
            </div>
            <button
              onClick={handleSave}
              className="w-full bg-primary text-primary-foreground rounded-lg py-3 text-sm font-semibold active:scale-95 transition-transform"
            >
              Save
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
