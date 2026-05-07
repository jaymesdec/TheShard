import { useState } from "react";
import { ChevronDown } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";

export default function DriBadge({ todo, members, onUpdateDri }) {
    const [isOpen, setIsOpen] = useState(false);
    const driMember = members.find((m) => m.id === todo.dri);
    const displayName = driMember?.name || driMember?.email || null;
    const initials = displayName
        ? displayName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
        : null;

    if (!onUpdateDri && !displayName) return null;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-[#EEF2FF] text-[#4338CA] hover:bg-[#E0E7FF] transition-colors"
                title={displayName ? `DRI: ${displayName}` : "Assign DRI"}
            >
                {initials ? (
                    <UserAvatar
                        name={driMember?.name}
                        email={driMember?.email}
                        profileColor={driMember?.profile_color}
                        image={driMember?.image}
                        size="xs"
                    />
                ) : (
                    <span className="w-4 h-4 rounded-full bg-[#C7D2FE] text-[#4338CA] text-[9px] flex items-center justify-center">?</span>
                )}
                <span className="max-w-[80px] truncate">{displayName || "Assign"}</span>
                <ChevronDown size={10} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-[#E5E5E5] rounded-lg shadow-lg py-1 min-w-[160px]">
                        {members.map((member) => (
                            <button
                                key={member.id}
                                onClick={() => {
                                    onUpdateDri(todo.id, member.id);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-3 py-1.5 text-[12px] hover:bg-[#F5F5F5] flex items-center gap-2 ${
                                    member.id === todo.dri ? "bg-[#EEF2FF] font-medium" : ""
                                }`}
                            >
                                <UserAvatar
                                    name={member.name}
                                    email={member.email}
                                    profileColor={member.profile_color}
                                    image={member.image}
                                    size="xs"
                                />
                                <span className="truncate">{member.name || member.email}</span>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
