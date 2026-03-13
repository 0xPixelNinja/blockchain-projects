"use client";

// Bulk product registration from Excel manifest using SheetJS + sequential on-chain transactions.
import { useState, useRef } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { LOGITRACK_ABI, LOGITRACK_ADDRESS } from "@/lib/contracts";
import { X, Upload, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import * as XLSX from "xlsx";

interface Row {
  ProductName: string;
  Origin: string;
  QualityDocCID: string;
}

type RowStatus = "pending" | "processing" | "done" | "failed";

interface RowResult {
  row: Row;
  status: RowStatus;
  txHash?: string;
  error?: string;
}

export function BulkImportModal({ onClose }: { onClose: () => void }) {
  const { isConnected } = useAccount();
  const [rows, setRows] = useState<Row[]>([]);
  const [results, setResults] = useState<RowResult[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [parseError, setParseError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { writeContractAsync } = useWriteContract();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError("");
    setRows([]);
    setResults([]);
    setDone(false);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const parsed: Row[] = XLSX.utils.sheet_to_json(sheet);

        const valid = parsed.filter(
          (r) => r.ProductName?.toString().trim() && r.Origin?.toString().trim() && r.QualityDocCID?.toString().trim()
        );
        if (valid.length === 0) {
          setParseError("No valid rows found. Ensure columns: ProductName, Origin, QualityDocCID");
          return;
        }
        setRows(valid);
      } catch {
        setParseError("Failed to parse Excel file.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleRegisterAll = async () => {
    if (!rows.length || !isConnected) return;
    setRunning(true);
    setDone(false);

    const initial: RowResult[] = rows.map((r) => ({ row: r, status: "pending" }));
    setResults(initial);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      setResults((prev) => prev.map((r, idx) => idx === i ? { ...r, status: "processing" } : r));

      try {
        const hash = await writeContractAsync({
          address: LOGITRACK_ADDRESS,
          abi: LOGITRACK_ABI,
          functionName: "registerProduct",
          args: [row.ProductName.toString(), row.Origin.toString(), row.QualityDocCID.toString()],
        });
        setResults((prev) =>
          prev.map((r, idx) => idx === i ? { ...r, status: "done", txHash: hash } : r)
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message.split("\n")[0] : "Transaction failed";
        setResults((prev) =>
          prev.map((r, idx) => idx === i ? { ...r, status: "failed", error: msg } : r)
        );
      }
    }

    setRunning(false);
    setDone(true);
  };

  const statusIcon = (status: RowStatus) => {
    if (status === "pending") return <Clock className="w-4 h-4 text-slate-600" />;
    if (status === "processing") return <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />;
    if (status === "done") return <CheckCircle className="w-4 h-4 text-green-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-[#0a0a0f] border border-slate-700 p-6 relative shadow-2xl max-h-[90vh] flex flex-col">
        <button onClick={onClose} disabled={running} className="absolute top-4 right-4 text-slate-500 hover:text-white disabled:opacity-30">
          <X size={20} />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-black text-white mb-1 uppercase tracking-tight">Bulk Import</h2>
          <p className="text-xs text-slate-500 font-mono">Upload an Excel file with columns: ProductName, Origin, QualityDocCID</p>
        </div>

        {!running && !done && (
          <div className="space-y-4 mb-6">
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-[#050505] border border-dashed border-slate-700 text-slate-400 p-6 text-xs font-mono flex items-center justify-center gap-2 hover:border-orange-500 hover:text-orange-400 transition-colors"
            >
              <Upload size={16} />
              Select Excel / CSV File
            </button>

            {parseError && (
              <div className="bg-red-900/10 border border-red-500/30 p-3">
                <div className="text-xs font-mono text-red-400">{parseError}</div>
              </div>
            )}

            {rows.length > 0 && (
              <div className="bg-orange-900/10 border border-orange-500/30 p-3">
                <div className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-1">
                  {rows.length} rows parsed
                </div>
                <div className="text-xs font-mono text-slate-400">
                  Each row requires a separate wallet confirmation.
                </div>
              </div>
            )}
          </div>
        )}

        {(running || done) && results.length > 0 && (
          <div className="flex-1 overflow-y-auto space-y-2 mb-4">
            {results.map((r, i) => (
              <div key={i} className={`border p-3 ${
                r.status === "done" ? "border-green-500/30 bg-green-900/5" :
                r.status === "failed" ? "border-red-500/30 bg-red-900/5" :
                r.status === "processing" ? "border-orange-500/30 bg-orange-900/5" :
                "border-slate-800"
              }`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {statusIcon(r.status)}
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{r.row.ProductName}</div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">{r.row.Origin}</div>
                    </div>
                  </div>
                  <div className="text-[9px] text-slate-600 font-mono uppercase shrink-0">{r.status}</div>
                </div>
                {r.txHash && (
                  <div className="mt-1 text-[9px] font-mono text-green-400 truncate">
                    tx: {r.txHash.slice(0, 20)}...
                  </div>
                )}
                {r.error && (
                  <div className="mt-1 text-[9px] font-mono text-red-400 truncate">{r.error}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {done && (
          <div className="mb-4 p-3 border border-green-500/30 bg-green-900/5">
            <div className="text-xs font-mono text-green-400">
              Import complete: {results.filter((r) => r.status === "done").length} succeeded,{" "}
              {results.filter((r) => r.status === "failed").length} failed.
            </div>
          </div>
        )}

        {!isConnected && (
          <div className="mb-4 bg-yellow-900/10 border border-yellow-500/30 p-3">
            <div className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest mb-1">Wallet Not Connected</div>
            <div className="text-xs font-mono text-yellow-300/70">Connect your wallet to register products.</div>
          </div>
        )}

        <div className="flex gap-3 mt-auto pt-4 border-t border-slate-800">
          {!done && (
            <button
              onClick={handleRegisterAll}
              disabled={running || rows.length === 0 || !isConnected}
              className="flex-1 bg-orange-600 hover:bg-orange-500 text-black font-bold py-4 text-xs tracking-widest uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {running && <Loader2 className="w-4 h-4 animate-spin" />}
              {running ? `Registering...` : `Register ${rows.length} Product${rows.length !== 1 ? "s" : ""}`}
            </button>
          )}
          {done && (
            <button
              onClick={onClose}
              className="flex-1 bg-slate-900 border border-slate-700 text-white py-4 text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
