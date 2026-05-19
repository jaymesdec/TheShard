import { FileText, CheckSquare, Square } from "lucide-react";

const MAX_VISIBLE = 20;
const SNIPPET_LENGTH = 80;

function buildSnippet(text, needle) {
    if (!text) return "";
    const lowerText = text.toLowerCase();
    const lowerNeedle = needle.toLowerCase();
    const matchIndex = lowerText.indexOf(lowerNeedle);
    if (matchIndex === -1) {
        return text.length > SNIPPET_LENGTH
            ? text.slice(0, SNIPPET_LENGTH) + "…"
            : text;
    }
    const start = Math.max(0, matchIndex - 20);
    const end = Math.min(text.length, matchIndex + needle.length + 40);
    const prefix = start > 0 ? "…" : "";
    const suffix = end < text.length ? "…" : "";
    return prefix + text.slice(start, end) + suffix;
}

function ResultRow({ result, query, onSelect }) {
    const isNote = result.kind === "note";
    const titleMatches =
        result.title &&
        result.title.toLowerCase().includes(query.toLowerCase());
    const displayTitle = result.title || (isNote ? "Untitled" : "");
    const displaySnippet =
        isNote && !titleMatches && result.snippet
            ? buildSnippet(result.snippet, query)
            : null;

    const Icon = isNote
        ? FileText
        : result.completed
          ? CheckSquare
          : Square;

    return (
        <button
            type="button"
            onMouseDown={(event) => {
                event.preventDefault();
                onSelect(result);
            }}
            className="w-full flex items-start gap-3 px-4 py-2.5 text-left hover:bg-[#F6F6F6] transition-colors"
        >
            <Icon
                size={14}
                className={`mt-0.5 shrink-0 ${
                    isNote ? "text-[#7A7A7A]" : "text-[#2563FF]"
                }`}
            />
            <div className="flex-1 min-w-0">
                <div
                    className={`text-[13px] text-[#2B2B2B] truncate ${
                        !isNote && result.completed ? "line-through opacity-60" : ""
                    }`}
                >
                    {displayTitle}
                </div>
                {displaySnippet && (
                    <div className="text-[11px] text-[#9B9B9B] truncate">
                        {displaySnippet}
                    </div>
                )}
            </div>
            <span className="text-[11px] text-[#7A7A7A] bg-[#F1F1F1] px-2 py-0.5 rounded-full shrink-0 ml-2">
                {result.group_name}
            </span>
        </button>
    );
}

export default function SearchDropdown({
    query,
    results,
    isLoading,
    onSelect,
}) {
    const visible = results.slice(0, MAX_VISIBLE);
    const overflow = Math.max(0, results.length - MAX_VISIBLE);

    return (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 bg-white rounded-2xl shadow-lg border border-[#E5E5E5] overflow-hidden max-h-[420px] overflow-y-auto">
            {isLoading && results.length === 0 ? (
                <div className="px-4 py-3 text-[13px] text-[#9B9B9B]">
                    Searching…
                </div>
            ) : results.length === 0 ? (
                <div className="px-4 py-3 text-[13px] text-[#9B9B9B]">
                    No results
                </div>
            ) : (
                <>
                    {visible.map((result) => (
                        <ResultRow
                            key={`${result.kind}-${result.id}`}
                            result={result}
                            query={query}
                            onSelect={onSelect}
                        />
                    ))}
                    {overflow > 0 && (
                        <div className="px-4 py-2 text-[11px] text-[#9B9B9B] border-t border-[#F1F1F1] text-center">
                            …and {overflow} more
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
