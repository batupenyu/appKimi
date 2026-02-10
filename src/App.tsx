import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Calculator,
  Building2,
  FileText,
  Menu,
  GraduationCap,
  FileBarChart,
  FileSignature,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import { Dashboard } from "@/sections/Dashboard";
import { PegawaiManager } from "@/sections/PegawaiManager";
import { AngkaIntegrasiManager } from "@/sections/AngkaIntegrasiManager";
import { PenilaianAngkaKreditManager } from "@/sections/PenilaianAngkaKreditManager";
import { InstansiManager } from "@/sections/InstansiManager";
import { AkPendidikanManager } from "@/sections/AkPendidikanManager";
import { CetakAkumulasi } from "@/components/CetakAkumulasi";
import { CetakPenetapan } from "@/components/CetakPenetapan";
import { CetakKonversi } from "@/components/CetakKonversi";
import type { ViewState } from "@/types";

const navigation = [
  { name: "Dashboard", icon: LayoutDashboard, view: "dashboard" as ViewState },
  {
    name: "Konversi Report",
    icon: FileText,
    view: "konversi-report" as ViewState,
  },
  { name: "Pegawai", icon: Users, view: "pegawai" as ViewState },
  {
    name: "Angka Integrasi",
    icon: Calculator,
    view: "angka-integrasi" as ViewState,
  },
  {
    name: "AK Pendidikan",
    icon: GraduationCap,
    view: "ak-pendidikan" as ViewState,
  },
  {
    name: "Buat Angka Kredit",
    icon: FileText,
    view: "penilaian-angka-kredit" as ViewState,
  },
  {
    name: "Cetak Akumulasi",
    icon: FileBarChart,
    view: "cetak-akumulasi" as ViewState,
  },
  {
    name: "Cetak Penetapan",
    icon: FileSignature,
    view: "cetak-penetapan" as ViewState,
  },
  { name: "Instansi", icon: Building2, view: "instansi" as ViewState },
];

function Sidebar({
  currentView,
  onViewChange,
}: {
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
}) {
  return (
    <div className="flex flex-col h-full bg-card border-r">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold">Sistem Kepegawaian</h1>
        <p className="text-xs text-muted-foreground">Manajemen Data Pegawai</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.view;
          return (
            <button
              key={item.name}
              onClick={() => onViewChange(item.view)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </button>
          );
        })}
      </nav>
      <div className="p-4 border-t">
        <p className="text-xs text-muted-foreground text-center">
          © 2024 Sistem Kepegawaian
        </p>
      </div>
    </div>
  );
}

function MobileSidebar({
  currentView,
  onViewChange,
}: {
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-72">
        <SheetTitle className="sr-only">Menu Navigasi</SheetTitle>
        <SheetDescription className="sr-only">
          Navigasi menu untuk sistem kepegawaian
        </SheetDescription>
        <div className="flex flex-col h-full bg-card">
          <div className="p-6 border-b flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Sistem Kepegawaian</h1>
              <p className="text-xs text-muted-foreground">
                Manajemen Data Pegawai
              </p>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.view;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    onViewChange(item.view);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </button>
              );
            })}
          </nav>
          <div className="p-4 border-t">
            <p className="text-xs text-muted-foreground text-center">
              © 2024 Sistem Kepegawaian
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MainContent({ view }: { view: ViewState }) {
  switch (view) {
    case "dashboard":
      return <Dashboard />;
    case "pegawai":
      return <PegawaiManager />;
    case "angka-integrasi":
      return <AngkaIntegrasiManager />;
    case "ak-pendidikan":
      return <AkPendidikanManager />;
    case "penilaian-angka-kredit":
      return <PenilaianAngkaKreditManager />;
    case "cetak-akumulasi":
      return <CetakAkumulasi />;
    case "cetak-penetapan":
      return <CetakPenetapan />;
    case "instansi":
      return <InstansiManager />;
    case "konversi-report":
      return <CetakKonversi />;
    default:
      return <Dashboard />;
  }
}

function App() {
  const [currentView, setCurrentView] = useState<ViewState>("dashboard");

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Layout */}
      <div className="hidden lg:flex">
        <div className="w-72 fixed h-screen">
          <Sidebar currentView={currentView} onViewChange={setCurrentView} />
        </div>
        <div className="flex-1 ml-72">
          <main className="p-8">
            <MainContent view={currentView} />
          </main>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-4 px-4 h-14">
            <MobileSidebar
              currentView={currentView}
              onViewChange={setCurrentView}
            />
            <h1 className="font-semibold">Sistem Kepegawaian</h1>
          </div>
        </header>
        <main className="p-4">
          <MainContent view={currentView} />
        </main>
      </div>

      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
