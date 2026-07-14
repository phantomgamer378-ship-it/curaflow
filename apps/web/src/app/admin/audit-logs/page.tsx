"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { 
  Search, Download, Plus, Pencil, Trash, Check, X, 
  ChevronDown, ChevronRight, Filter, ChevronLeft
} from "lucide-react";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [resourceFilter, setResourceFilter] = useState("");
  
  const [cursorHistory, setCursorHistory] = useState<string[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = (cursor?: string) => {
    setLoading(true);
    let url = `/api/admin/audit-logs?limit=25`;
    if (cursor) url += `&cursor=${cursor}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (actionFilter) url += `&action=${actionFilter}`;
    if (resourceFilter) url += `&resourceType=${resourceFilter}`;

    apiFetch(url).then(res => {
      if (res.ok) {
        setLogs(res.data);
        setNextCursor(res.pagination.nextCursor);
        setHasMore(res.pagination.hasMore);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    setCursorHistory([]);
    fetchLogs();
  }, [search, actionFilter, resourceFilter]);

  const handleNext = () => {
    if (nextCursor) {
      setCursorHistory([...cursorHistory, nextCursor]);
      fetchLogs(nextCursor);
    }
  };

  const handlePrev = () => {
    const newHistory = [...cursorHistory];
    newHistory.pop();
    setCursorHistory(newHistory);
    const prevCursor = newHistory.length > 0 ? newHistory[newHistory.length - 1] : undefined;
    fetchLogs(prevCursor);
  };

  const handleExport = () => {
    let url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/admin/audit-logs/export?`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (actionFilter) url += `&action=${actionFilter}`;
    if (resourceFilter) url += `&resourceType=${resourceFilter}`;
    
    window.open(url, "_blank");
  };

  const groupLogs = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups: { label: string, items: any[] }[] = [
      { label: "Today", items: [] },
      { label: "Yesterday", items: [] },
      { label: "Earlier", items: [] }
    ];

    logs.forEach(log => {
      const d = new Date(log.createdAt);
      if (d >= today) groups[0].items.push(log);
      else if (d >= yesterday) groups[1].items.push(log);
      else groups[2].items.push(log);
    });

    return groups.filter(g => g.items.length > 0);
  };

  const getActionIcon = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes("CREATE") || act.includes("ADD")) return <Plus size={16} className="text-green-500" />;
    if (act.includes("UPDATE") || act.includes("EDIT")) return <Pencil size={16} className="text-blue-500" />;
    if (act.includes("DELETE") || act.includes("REMOVE")) return <Trash size={16} className="text-red-500" />;
    if (act.includes("APPROVE")) return <Check size={16} className="text-green-500" />;
    if (act.includes("REJECT")) return <X size={16} className="text-red-500" />;
    return <ChevronRight size={16} className="text-gray-400" />;
  };

  const formatTimeAgo = (dateStr: string) => {
    const ms = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>Audit Logs</h1>
          <p style={{ color: "#64748b" }}>Track and audit system-wide actions.</p>
        </div>
        <button 
          onClick={handleExport}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "6px", cursor: "pointer" }}
        >
          <Download size={16} /> Export CSV
        </button>
      </header>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", backgroundColor: "white", padding: "1rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "#94a3b8" }} />
          <input 
            type="text" 
            placeholder="Search actors, actions, resources..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: "0.5rem 0.5rem 0.5rem 2.25rem", borderRadius: "6px", border: "1px solid #e2e8f0" }}
          />
        </div>
        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
          <option value="">All Actions</option>
          <option value="CREATE_DOCTOR">Create Doctor</option>
          <option value="UPDATE_CLINIC">Update Clinic</option>
          <option value="ADMIN_REMOVE_FROM_QUEUE">Remove Queue Entry</option>
        </select>
        <select value={resourceFilter} onChange={e => setResourceFilter(e.target.value)} style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
          <option value="">All Resources</option>
          <option value="Doctor">Doctor</option>
          <option value="Clinic">Clinic</option>
          <option value="QueueEntry">Queue Entry</option>
        </select>
      </div>

      <div style={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #e2e8f0", minHeight: "400px" }}>
        {loading && <div style={{ padding: "2rem", textAlign: "center" }}>Loading logs...</div>}
        
        {!loading && logs.length === 0 && (
          <div style={{ padding: "4rem 2rem", textAlign: "center", color: "#64748b" }}>
            No audit logs found matching criteria.
          </div>
        )}

        {!loading && groupLogs().map(group => (
          <div key={group.label}>
            <div style={{ padding: "0.5rem 1rem", backgroundColor: "#f8fafc", fontWeight: "bold", borderBottom: "1px solid #e2e8f0", borderTop: group.label !== "Today" ? "1px solid #e2e8f0" : "none", color: "#475569", fontSize: "0.875rem", textTransform: "uppercase" }}>
              {group.label}
            </div>
            {group.items.map(log => (
              <div key={log.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <div 
                  onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                  style={{ display: "grid", gridTemplateColumns: "32px 1fr 1fr 1fr 100px 24px", alignItems: "center", padding: "1rem", cursor: "pointer", fontSize: "0.875rem" }}
                >
                  <div>{getActionIcon(log.action)}</div>
                  <div>
                    <strong>{log.profile?.name || "System"}</strong>
                    <span style={{ marginLeft: "0.5rem", padding: "0.1rem 0.4rem", backgroundColor: "#e2e8f0", borderRadius: "99px", fontSize: "0.7rem", color: "#475569" }}>
                      {log.profile?.role || "system"}
                    </span>
                  </div>
                  <div style={{ fontWeight: "500" }}>{log.action}</div>
                  <div style={{ color: "#64748b" }}>
                    {log.resourceType} {log.resourceId ? `#${log.resourceId.slice(0, 6)}` : ""}
                  </div>
                  <div style={{ color: "#94a3b8", textAlign: "right" }} title={new Date(log.createdAt).toLocaleString()}>
                    {formatTimeAgo(log.createdAt)}
                  </div>
                  <div style={{ textAlign: "right", color: "#cbd5e1" }}>
                    {expandedId === log.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                </div>
                {expandedId === log.id && (
                  <div style={{ padding: "1rem 1rem 1rem 3rem", backgroundColor: "#f8fafc", borderTop: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9", fontSize: "0.875rem" }}>
                    <h4 style={{ fontWeight: "bold", marginBottom: "0.5rem", color: "#475569" }}>Metadata</h4>
                    <pre style={{ margin: 0, padding: "1rem", backgroundColor: "#0f172a", color: "#f8fafc", borderRadius: "6px", overflowX: "auto" }}>
                      {log.metadata ? JSON.stringify(JSON.parse(log.metadata), null, 2) : "{}"}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}

        <div style={{ padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e2e8f0" }}>
          <button 
            disabled={cursorHistory.length === 0}
            onClick={handlePrev}
            style={{ padding: "0.5rem 1rem", backgroundColor: cursorHistory.length === 0 ? "#f1f5f9" : "white", border: "1px solid #e2e8f0", borderRadius: "6px", cursor: cursorHistory.length === 0 ? "not-allowed" : "pointer" }}
          >
            Previous
          </button>
          <span style={{ fontSize: "0.875rem", color: "#64748b" }}>
            Page {cursorHistory.length + 1}
          </span>
          <button 
            disabled={!hasMore}
            onClick={handleNext}
            style={{ padding: "0.5rem 1rem", backgroundColor: !hasMore ? "#f1f5f9" : "white", border: "1px solid #e2e8f0", borderRadius: "6px", cursor: !hasMore ? "not-allowed" : "pointer" }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
