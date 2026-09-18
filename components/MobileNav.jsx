const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, LogOut, Users as UsersIcon } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

import { useI18n } from "@/lib/i18n";

// Sidebar mobile : menu hamburger fluide donnant accès à tous les modules
export default function MobileNav({ sections, household, user }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { t } = useI18n();
  const initials = (user?.full_name || user?.email || "?").slice(0, 2).toUpperCase();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-gray-900 transition-colors hover:bg-gray-100 active:scale-95 md:hidden"
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 overflow-y-auto p-0">
        <div className="flex items-center gap-2.5 border-b border-border px-4 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <UsersIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <SheetTitle className="truncate text-sm font-semibold">
              {household?.name || "Kolo"}
            </SheetTitle>
            <p className="truncate text-xs text-muted-foreground">
              {user?.data?.display_name || user?.full_name || user?.email}
            </p>
          </div>
        </div>

        <nav className="px-3 py-3">
          {sections.map((section) => (
            <div key={section.title} className="mb-3">
              <div className="px-2.5 pb-1 pt-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {t(section.title)}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = location.pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
                        active
                          ? "bg-secondary font-medium text-foreground"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {t(item.label)}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
            <Avatar className="h-8 w-8">
              {user?.data?.avatar_url && <AvatarImage src={user.data.avatar_url} alt="Avatar" />}
              <AvatarFallback className="bg-secondary text-xs text-secondary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">
                {user?.data?.display_name || user?.full_name || "Membre"}
              </div>
              <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={() => db.auth.logout()}
            className="mt-1 flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <LogOut className="h-4 w-4" /> Se déconnecter
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}