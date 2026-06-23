"use client";

import { useCallback, useEffect, useState } from "react";
import type { BelloryClientConfigDraft } from "@/lib/server/config/client-config-schema";
import {
  createClient,
  listClients,
  listIssues,
  saveClientConfigDraft,
  type AppClient,
  type ClientIssue,
  type CreateClientPayload,
} from "@/lib/client-api";
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
  const [clients, setClients] = useState<AppClient[]>([]);
  const [issues, setIssues] = useState<ClientIssue[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [issuesLoading, setIssuesLoading] = useState(true);
  const [clientsError, setClientsError] = useState<string | null>(null);
  const [issuesError, setIssuesError] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [accountView, setAccountView] = useState<"directory" | "detail">("directory");

  const refreshClients = useCallback(async () => {
    setClientsLoading(true);
    setClientsError(null);
    try {
      const nextClients = await listClients();
      setClients(nextClients);
      setSelectedAccountId((current) => current || nextClients[0]?.id || "");
    } catch (error) {
      setClientsError(error instanceof Error ? error.message : "Unable to load clients");
    } finally {
      setClientsLoading(false);
    }
  }, []);

  const refreshIssues = useCallback(async () => {
    setIssuesLoading(true);
    setIssuesError(null);
    try {
      setIssues(await listIssues());
    } catch (error) {
      setIssuesError(error instanceof Error ? error.message : "Unable to load issues");
    } finally {
      setIssuesLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void refreshClients();
      void refreshIssues();
    });
  }, [refreshClients, refreshIssues]);

  const navigate = (id: PageId) => {
    if (id === "account") setAccountView("directory");
    setActive(id);
  };

  const openAccount = (id: string) => {
    setSelectedAccountId(id);
    setAccountView("detail");
    setActive("account");
  };

  const createBusiness = async (payload: CreateClientPayload, configPatch: BelloryClientConfigDraft) => {
    const created = await createClient(payload);

    if (Object.keys(configPatch).length > 0) {
      await saveClientConfigDraft(created.client.id, configPatch);
    }

    await refreshClients();
    await refreshIssues();
    setSelectedAccountId(created.client.id);
    setAccountView("detail");
    setActive("account");
    return created.client.id;
  };

  const content = {
    accounts: (
      <AccountsPage
        clients={clients}
        loading={clientsLoading}
        error={clientsError}
        navigate={navigate}
        onOpenAccount={openAccount}
        onRefresh={refreshClients}
      />
    ),
    setup: <NewBusinessSetupPage onCreateBusiness={createBusiness} />,
    account: (
      <AccountDetailPage
        accountId={selectedAccountId}
        clients={clients}
        loading={clientsLoading}
        error={clientsError}
        onOpenAccount={openAccount}
        onShowDirectory={() => setAccountView("directory")}
        onRefreshClients={refreshClients}
        onRefreshIssues={refreshIssues}
        view={accountView}
      />
    ),
    issues: (
      <IssuesPage
        issues={issues}
        loading={issuesLoading}
        error={issuesError}
        onOpenAccount={openAccount}
        onRefresh={refreshIssues}
      />
    ),
    reports: (
      <ReportsPage
        clients={clients}
        loading={clientsLoading}
        error={clientsError}
        onOpenAccount={openAccount}
        onRefresh={refreshClients}
      />
    ),
    settings: <OperatorSettingsPage />,
  };

  return (
    <AppShell active={active} onNavigate={navigate} issueCount={issues.length}>
      {content[active]}
    </AppShell>
  );
}
