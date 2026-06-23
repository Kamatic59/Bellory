"use client";

import { useState } from "react";
import { clients } from "@/data/mock";
import { AppShell, PageId } from "./app-shell";
import {
  AccountDetailPage,
  AccountsPage,
  IssuesPage,
  NewBusinessSetupPage,
  OperatorSettingsPage,
  ReportsPage,
} from "./operator-pages";

export function BelloryApp() {
  const [active, setActive] = useState<PageId>("accounts");
  const [selectedAccountId, setSelectedAccountId] = useState(clients[0]?.id ?? "davis");
  const [accountView, setAccountView] = useState<"directory" | "detail">("directory");

  const navigate = (id: PageId) => {
    if (id === "account") setAccountView("directory");
    setActive(id);
  };

  const openAccount = (id: string) => {
    setSelectedAccountId(id);
    setAccountView("detail");
    setActive("account");
  };

  const content = {
    accounts: <AccountsPage navigate={navigate} onOpenAccount={openAccount} />,
    setup: <NewBusinessSetupPage navigate={navigate} />,
    account: (
      <AccountDetailPage
        accountId={selectedAccountId}
        navigate={navigate}
        onOpenAccount={openAccount}
        onShowDirectory={() => setAccountView("directory")}
        view={accountView}
      />
    ),
    issues: <IssuesPage onOpenAccount={openAccount} />,
    reports: <ReportsPage onOpenAccount={openAccount} />,
    settings: <OperatorSettingsPage />,
  };

  return (
    <AppShell active={active} onNavigate={navigate}>
      {content[active]}
    </AppShell>
  );
}
