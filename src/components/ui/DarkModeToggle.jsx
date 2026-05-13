import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export default function DarkModeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <button onClick={() => setDark(!dark)} className="p-2 rounded-xl hover:bg-teal/10 dark:hover:bg-teal-deep/30 transition-colors">
      {dark ? <Sun size={20} className="text-sand" /> : <Moon size={20} className="text-primary" />}
    </button>
  );
}
