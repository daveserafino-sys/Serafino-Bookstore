import React, { useState, useRef } from "react";
import { Book, Publication, WriterData } from "../types";
import { Save, Upload, Plus, Trash2, Key, HelpCircle, Loader2, CheckCircle, AlertTriangle } from "lucide-react";

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  writerData: WriterData;
  onSaveData: (updatedData: WriterData, passcode: string) => Promise<boolean>;
}

export default function AdminPanel({
  isOpen,
  onClose,
  writerData,
  onSaveData
}: AdminPanelProps) {
  const [passcode, setPasscode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Local working copy of state
  const [localData, setLocalData] = useState<WriterData>({ books: [], publications: [], paypalEmails: [] });
  const [activeTab, setActiveTab] = useState<"books" | "publications" | "emails">("books");
  const [uploadingFor, setUploadingFor] = useState<{ id: string; type: "book" | "pub"; field: "pdf" | "epub" } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === "") {
      setError("Please specify an administrative passcode.");
      return;
    }
    
    // Attempt authentication by cloning the real data
    const parsedData = JSON.parse(JSON.stringify(writerData));
    if (!parsedData.paypalEmails) parsedData.paypalEmails = [];
    setLocalData(parsedData);
    setIsAuthenticated(true);
    setError(null);
  };

  const handleDownloadEmails = () => {
    if (!localData.paypalEmails || localData.paypalEmails.length === 0) return;
    
    // Format as CSV
    const headers = "Email,Date,Book/Story Title,Format\n";
    const rows = localData.paypalEmails.map(item => 
      `"${item.email}","${new Date(item.date).toLocaleString()}","${item.bookTitle}","${item.format}"`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `paypal_collected_emails_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveAll = async () => {
    setError(null);
    setSuccessMsg(null);
    
    const success = await onSaveData(localData, passcode);
    if (success) {
      setSuccessMsg("System configuration saved successfully.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      setError("Failed to sync changes. Verify administrative passcode is correct.");
    }
  };

  // Books Edit Helpers
  const updateBookField = (id: string, field: keyof Book, value: any) => {
    setLocalData(prev => ({
      ...prev,
      books: prev.books.map(b => b.id === id ? { ...b, [field]: value } : b)
    }));
  };

  // Publications Edit Helpers
  const addPublication = () => {
    const newPub: Publication = {
      id: `pub-${Date.now()}`,
      title: "New Shorter Manuscript",
      outlet: "Literary Quarterly",
      date: "Spring 2026",
      url: "",
      pdfUrl: "",
      epubUrl: ""
    };
    setLocalData(prev => ({
      ...prev,
      publications: [newPub, ...prev.publications]
    }));
  };

  const removePublication = (id: string) => {
    setLocalData(prev => ({
      ...prev,
      publications: prev.publications.filter(p => p.id !== id)
    }));
  };

  const updatePubField = (id: string, field: keyof Publication, value: any) => {
    setLocalData(prev => ({
      ...prev,
      publications: prev.publications.map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
  };

  // Base64 File Upload Engine
  const triggerFileUpload = (id: string, type: "book" | "pub", field: "pdf" | "epub") => {
    setUploadingFor({ id, type, field });
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 50);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingFor) return;

    // Type validation
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (uploadingFor.field === "pdf" && ext !== "pdf") {
      setError("Format mismatch. A PDF document (.pdf) is required.");
      return;
    }
    if (uploadingFor.field === "epub" && ext !== "epub") {
      setError("Format mismatch. An EPUB volume (.epub) is required.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const fileDataStr = event.target?.result as string;
      if (!fileDataStr) return;

      try {
        const response = await fetch("/api/upload-file", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            passcode,
            fileName: file.name,
            fileData: fileDataStr
          })
        });

        const resData = await response.json();
        if (!response.ok) {
          throw new Error(resData.error || "Upload transfer failed.");
        }

        const uploadedUrl = resData.url;
        const finalName = resData.fileName;

        if (uploadingFor.type === "book") {
          updateBookField(
            uploadingFor.id, 
            uploadingFor.field === "pdf" ? "pdfUrl" : "epubUrl", 
            uploadedUrl
          );
          updateBookField(
            uploadingFor.id, 
            uploadingFor.field === "pdf" ? "pdfFileName" : "epubFileName", 
            finalName
          );
        } else {
          updatePubField(
            uploadingFor.id, 
            uploadingFor.field === "pdf" ? "pdfUrl" : "epubUrl", 
            uploadedUrl
          );
          updatePubField(
            uploadingFor.id, 
            uploadingFor.field === "pdf" ? "pdfFileName" : "epubFileName", 
            finalName
          );
        }

        setSuccessMsg(`File [ ${finalName} ] uploaded successfully! Save changes to persist.`);
        setTimeout(() => setSuccessMsg(null), 4000);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "An error occurred uploading the file.");
      } finally {
        setUploadingFor(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-sans">
      <div 
        id="admin-panel-container"
        className="w-full max-w-4xl h-[85vh] bg-[#FAF8F5] border-2 border-double border-[#8C7A5B]/40 rounded-lg flex flex-col shadow-2xl overflow-hidden text-[#23211E]"
      >
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={uploadingFor?.field === "pdf" ? ".pdf" : ".epub"}
          className="hidden"
        />

        {/* Panel Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#8C7A5B]/15 bg-[#F1EDE6]">
          <div className="flex items-center gap-3">
            <Key size={18} className="text-[#8C7A5B]" />
            <div>
              <h3 className="text-lg font-serif italic text-[#23211E] font-medium">Administration Deck</h3>
              <p className="text-[10px] font-mono tracking-wider text-[#8C7A5B]">CATALOG CONFIGURATION GATEWAY</p>
            </div>
          </div>
          <button
            id="close-admin-panel-btn"
            onClick={onClose}
            className="text-[#8C7A5B] hover:text-[#5E4E35] font-mono text-[10px] tracking-widest cursor-pointer uppercase"
          >
            [ Close ]
          </button>
        </div>

        {!isAuthenticated ? (
          /* Authentication Gate */
          <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-md mx-auto text-center">
            <div className="w-12 h-12 bg-[#F1EDE6] border border-[#8C7A5B]/30 rounded-full flex items-center justify-center text-[#8C7A5B] mb-4">
              <Key size={20} />
            </div>
            
            <h4 className="text-base font-serif italic text-[#23211E] mb-2 font-medium">Administrative Passcode Required</h4>
            <p className="text-xs text-[#625E57] mb-6 leading-relaxed font-light">
              Verify security credentials to unlock the document archive. Default setup uses passcode <code className="text-[#8C7A5B] bg-[#F1EDE6] px-1 py-0.5 rounded border border-[#8C7A5B]/20 font-mono">writer123</code>.
            </p>

            <form onSubmit={handleLogin} className="w-full space-y-4">
              <input
                id="admin-passcode-input"
                type="password"
                placeholder="Enter Passcode..."
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-stone-200 rounded text-center text-[#23211E] focus:outline-none focus:border-[#8C7A5B] text-sm font-mono tracking-widest placeholder:tracking-normal"
              />

              {error && <p className="text-xs text-red-700 bg-red-50 py-1.5 px-3 border border-red-200 rounded font-light">{error}</p>}

              <button
                id="submit-passcode-btn"
                type="submit"
                className="w-full py-2.5 bg-[#8C7A5B] text-white hover:bg-[#5E4E35] transition-all font-medium text-sm rounded cursor-pointer uppercase font-mono tracking-widest text-[10px]"
              >
                Authenticate Session
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Panel Layout */
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Context Navigation Tabs */}
            <div className="flex items-center justify-between border-b border-[#8C7A5B]/15 bg-[#F1EDE6] px-6 py-2">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab("books")}
                  className={`py-2 text-[10px] font-mono tracking-wider transition-all border-b-2 cursor-pointer ${
                    activeTab === "books"
                      ? "text-[#8C7A5B] border-[#8C7A5B] font-semibold"
                      : "text-[#625E57]/50 border-transparent hover:text-[#23211E]"
                  }`}
                >
                  MANUSCRIPTS
                </button>
                <button
                  onClick={() => setActiveTab("publications")}
                  className={`py-2 text-[10px] font-mono tracking-wider transition-all border-b-2 cursor-pointer ${
                    activeTab === "publications"
                      ? "text-[#8C7A5B] border-[#8C7A5B] font-semibold"
                      : "text-[#625E57]/50 border-transparent hover:text-[#23211E]"
                  }`}
                >
                  SELECTED PUBLICATIONS
                </button>
                <button
                  onClick={() => setActiveTab("emails")}
                  className={`py-2 text-[10px] font-mono tracking-wider transition-all border-b-2 cursor-pointer ${
                    activeTab === "emails"
                      ? "text-[#8C7A5B] border-[#8C7A5B] font-semibold"
                      : "text-[#625E57]/50 border-transparent hover:text-[#23211E]"
                  }`}
                >
                  COLLECTED EMAILS
                </button>
              </div>

              <div className="flex items-center gap-3">
                {activeTab === "publications" && (
                  <button
                    id="add-publication-btn"
                    onClick={addPublication}
                    className="flex items-center gap-1.5 px-3 py-1 bg-[#FAF8F5] border border-[#8C7A5B]/30 text-[#8C7A5B] hover:bg-[#8C7A5B]/10 transition-all rounded text-[10px] font-mono cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>ADD ITEM</span>
                  </button>
                )}

                <button
                  id="save-admin-changes-btn"
                  onClick={handleSaveAll}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-[#8C7A5B] text-white hover:bg-[#5E4E35] transition-all rounded text-[10px] font-mono font-bold cursor-pointer"
                >
                  <Save size={12} />
                  <span>SYNC WORK</span>
                </button>
              </div>
            </div>

            {/* Notification Banner Area */}
            {successMsg && (
              <div className="bg-emerald-50 border-y border-emerald-200 text-emerald-800 px-6 py-2 text-xs flex items-center gap-2">
                <CheckCircle size={14} />
                <span>{successMsg}</span>
              </div>
            )}
            {error && (
              <div className="bg-red-50 border-y border-red-200 text-red-800 px-6 py-2 text-xs flex items-center gap-2">
                <AlertTriangle size={14} />
                <span>{error}</span>
              </div>
            )}

            {/* Editable Content Workspace */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeTab === "books" ? (
                /* Edit Manuscripts List */
                <div className="space-y-6">
                  {localData.books.map((book) => (
                    <div 
                      key={book.id} 
                      className="bg-[#F1EDE6]/30 border border-[#8C7A5B]/15 p-5 rounded-lg space-y-4"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-[10px] text-[#8C7A5B] uppercase tracking-widest">
                          ID: {book.id}
                        </span>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 border border-[#8C7A5B]/15 rounded font-mono text-[10px] text-[#23211E] shadow-sm">
                          <span className="text-[#8C7A5B]">DOWNLOADS:</span>
                          <span className="font-bold">{book.downloads || 0}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono tracking-wider text-[#625E57] block">MANUSCRIPT TITLE</label>
                          <input
                            type="text"
                            value={book.title}
                            onChange={(e) => updateBookField(book.id, "title", e.target.value)}
                            className="w-full px-3 py-1.5 bg-[#FAF8F5] border border-stone-200 rounded text-xs text-[#23211E] focus:outline-none focus:border-[#8C7A5B]"
                          />
                        </div>
                      </div>

                      {/* File Download Handlers */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-stone-200/60 pt-3">
                        {/* PDF handler */}
                        <div className="flex items-center justify-between gap-4 p-2 bg-[#FAF8F5] border border-stone-200 rounded">
                          <div className="overflow-hidden">
                            <span className="text-[10px] font-mono tracking-wider text-[#625E57] block">PDF FORMAT</span>
                            <span className="text-xs text-[#23211E] block truncate font-mono font-medium">
                              {book.pdfFileName || (book.pdfUrl ? "Uploaded PDF" : "Default / Empty")}
                            </span>
                          </div>
                          <button
                            onClick={() => triggerFileUpload(book.id, "book", "pdf")}
                            className="px-2.5 py-1.5 bg-[#FAF8F5] hover:bg-[#F1EDE6] text-[#8C7A5B] border border-[#8C7A5B]/20 rounded text-[10px] font-mono flex items-center gap-1 cursor-pointer whitespace-nowrap"
                          >
                            <Upload size={10} />
                            <span>REPLACE PDF</span>
                          </button>
                        </div>

                        {/* EPUB handler */}
                        <div className="flex items-center justify-between gap-4 p-2 bg-[#FAF8F5] border border-stone-200 rounded">
                          <div className="overflow-hidden">
                            <span className="text-[10px] font-mono tracking-wider text-[#625E57] block">EPUB FORMAT</span>
                            <span className="text-xs text-[#23211E] block truncate font-mono font-medium">
                              {book.epubFileName || (book.epubUrl ? "Uploaded EPUB" : "Default / Empty")}
                            </span>
                          </div>
                          <button
                            onClick={() => triggerFileUpload(book.id, "book", "epub")}
                            className="px-2.5 py-1.5 bg-[#FAF8F5] hover:bg-[#F1EDE6] text-[#8C7A5B] border border-[#8C7A5B]/20 rounded text-[10px] font-mono flex items-center gap-1 cursor-pointer whitespace-nowrap"
                          >
                            <Upload size={10} />
                            <span>REPLACE EPUB</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : activeTab === "publications" ? (
                /* Edit Selected Publications */
                <div className="space-y-6">
                  {localData.publications.map((pub) => (
                    <div 
                      key={pub.id} 
                      className="bg-[#F1EDE6]/30 border border-[#8C7A5B]/15 p-5 rounded-lg space-y-4 relative group"
                    >
                      {/* Delete publication button */}
                      <button
                        onClick={() => removePublication(pub.id)}
                        className="absolute top-4 right-4 text-[#8C7A5B] hover:text-red-700 transition-colors p-1.5 rounded bg-[#FAF8F5] hover:bg-red-50 border border-stone-200 cursor-pointer"
                        title="Delete Publication"
                      >
                        <Trash2 size={12} />
                      </button>

                      <div className="flex justify-between items-center mb-1">
                        <span className="font-mono text-[9px] text-[#8C7A5B] uppercase tracking-widest">
                          STORY RECORD
                        </span>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 border border-[#8C7A5B]/15 rounded font-mono text-[10px] text-[#23211E] shadow-sm mr-10">
                          <span className="text-[#8C7A5B]">DOWNLOADS:</span>
                          <span className="font-bold">{pub.downloads || 0}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono tracking-wider text-[#625E57] block">STORY TITLE</label>
                          <input
                            type="text"
                            value={pub.title}
                            onChange={(e) => updatePubField(pub.id, "title", e.target.value)}
                            className="w-full px-3 py-1.5 bg-[#FAF8F5] border border-stone-200 rounded text-xs text-[#23211E] focus:outline-none focus:border-[#8C7A5B]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-mono tracking-wider text-[#625E57] block">PLACE OF PUBLICATION (OUTLET)</label>
                          <input
                            type="text"
                            value={pub.outlet}
                            onChange={(e) => updatePubField(pub.id, "outlet", e.target.value)}
                            className="w-full px-3 py-1.5 bg-[#FAF8F5] border border-stone-200 rounded text-xs text-[#23211E] focus:outline-none focus:border-[#8C7A5B]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-mono tracking-wider text-[#625E57] block">MONTH/YEAR OF PUBLICATION (RELEASE DATE)</label>
                          <input
                            type="text"
                            value={pub.date}
                            onChange={(e) => updatePubField(pub.id, "date", e.target.value)}
                            className="w-full px-3 py-1.5 bg-[#FAF8F5] border border-stone-200 rounded text-xs text-[#23211E] focus:outline-none focus:border-[#8C7A5B] font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono tracking-wider text-[#625E57] block">EXTERNAL OUTLET HYPERLINK (URL)</label>
                          <input
                            type="text"
                            value={pub.url}
                            onChange={(e) => updatePubField(pub.id, "url", e.target.value)}
                            placeholder="https://example.com/curated-manuscript-link"
                            className="w-full px-3 py-1.5 bg-[#FAF8F5] border border-stone-200 rounded text-xs text-[#23211E] focus:outline-none focus:border-[#8C7A5B] font-mono"
                          />
                        </div>
                      </div>

                      {/* File uploads for publication */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-stone-200/60 pt-3">
                        {/* PDF copy upload */}
                        <div className="flex items-center justify-between gap-4 p-2 bg-[#FAF8F5] border border-stone-200 rounded">
                          <div className="overflow-hidden">
                            <span className="text-[10px] font-mono tracking-wider text-[#625E57] block">PDF COPY</span>
                            <span className="text-xs text-[#23211E] block truncate font-mono font-medium">
                              {pub.pdfFileName || (pub.pdfUrl ? "Uploaded PDF" : "Default / Empty")}
                            </span>
                          </div>
                          <button
                            onClick={() => triggerFileUpload(pub.id, "pub", "pdf")}
                            className="px-2.5 py-1.5 bg-[#FAF8F5] hover:bg-[#F1EDE6] text-[#8C7A5B] border border-[#8C7A5B]/20 rounded text-[10px] font-mono flex items-center gap-1 cursor-pointer whitespace-nowrap"
                          >
                            <Upload size={10} />
                            <span>REPLACE PDF</span>
                          </button>
                        </div>

                        {/* EPUB copy upload */}
                        <div className="flex items-center justify-between gap-4 p-2 bg-[#FAF8F5] border border-stone-200 rounded">
                          <div className="overflow-hidden">
                            <span className="text-[10px] font-mono tracking-wider text-[#625E57] block">EPUB COPY</span>
                            <span className="text-xs text-[#23211E] block truncate font-mono font-medium">
                              {pub.epubFileName || (pub.epubUrl ? "Uploaded EPUB" : "Default / Empty")}
                            </span>
                          </div>
                          <button
                            onClick={() => triggerFileUpload(pub.id, "pub", "epub")}
                            className="px-2.5 py-1.5 bg-[#FAF8F5] hover:bg-[#F1EDE6] text-[#8C7A5B] border border-[#8C7A5B]/20 rounded text-[10px] font-mono flex items-center gap-1 cursor-pointer whitespace-nowrap"
                          >
                            <Upload size={10} />
                            <span>REPLACE EPUB</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Collected Emails tab */
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-[#8C7A5B]/15">
                    <div>
                      <h4 className="text-sm font-serif italic text-[#23211E] font-medium">PayPal Purchased Emails</h4>
                      <p className="text-[10px] font-mono tracking-wider text-[#8C7A5B] mt-0.5 uppercase">
                        Total Collected: {localData.paypalEmails?.length || 0} addresses
                      </p>
                    </div>
                    {localData.paypalEmails && localData.paypalEmails.length > 0 && (
                      <button
                        onClick={handleDownloadEmails}
                        className="flex items-center gap-1.5 px-3 py-1 bg-[#8C7A5B] text-white hover:bg-[#5E4E35] transition-all rounded text-[10px] font-mono cursor-pointer"
                      >
                        <Upload size={10} className="rotate-180" />
                        <span>DOWNLOAD LIST (.CSV)</span>
                      </button>
                    )}
                  </div>

                  {!localData.paypalEmails || localData.paypalEmails.length === 0 ? (
                    <div className="text-center py-12 bg-[#F1EDE6]/20 border border-stone-200/50 rounded-lg">
                      <p className="text-xs font-mono text-stone-500">No email addresses collected yet.</p>
                    </div>
                  ) : (
                    <div className="border border-stone-200 rounded-lg overflow-hidden bg-white shadow-sm">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-[#F1EDE6]/60 font-mono text-[9px] tracking-wider text-[#8C7A5B] border-b border-stone-200 uppercase">
                            <th className="p-3 font-medium">Email Address</th>
                            <th className="p-3 font-medium">Book/Story Title</th>
                            <th className="p-3 font-medium">Format</th>
                            <th className="p-3 font-medium">Date Collected</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {localData.paypalEmails.map((record, index) => (
                            <tr key={index} className="hover:bg-stone-50/50 transition-colors">
                              <td className="p-3 font-mono font-medium text-[#23211E]">{record.email}</td>
                              <td className="p-3 text-stone-700 italic font-serif">{record.bookTitle}</td>
                              <td className="p-3 font-mono text-stone-500 uppercase text-[10px]">{record.format}</td>
                              <td className="p-3 text-stone-500 font-mono text-[10px]">
                                {new Date(record.date).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
