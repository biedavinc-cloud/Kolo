import { UserX } from "lucide-react";
import { Image } from "@/components/ui/image";
import { LOGO_URL } from "@/lib/branding";
import { useAuth } from "@/lib/AuthContext";

export default function UserNotRegisteredError() {
  const { logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <Image src={LOGO_URL} alt="Kolo" className="h-12 w-12 rounded-xl object-cover" />
      <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
        <UserX className="h-6 w-6" />
      </div>
      <h1 className="mt-4 text-xl font-semibold tracking-tight">Compte non enregistré</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Ce compte n'est pas encore enregistré sur Kolo. Contactez l'administrateur de votre foyer
        ou reconnectez-vous avec un autre compte.
      </p>
      <button
        onClick={() => logout()}
        className="mt-6 inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors duration-200 hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
      >
        Se déconnecter
      </button>
    </div>
  );
}
