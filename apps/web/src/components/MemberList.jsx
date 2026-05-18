import UserAvatar from "@/components/UserAvatar";

export default function MemberList({ members, driCounts = {}, compact = false }) {
    return (
        <div
            className={`flex flex-col ${
                compact ? "shrink-0 max-h-[40%]" : "flex-1 min-h-0"
            }`}
        >
            <div className="h-[40px] flex items-center px-6 border-b border-[#EDEDED] bg-white shrink-0">
                <h3 className="text-[13px] font-semibold">Members</h3>
            </div>

            <div className="px-6 py-3 overflow-y-auto flex-1 min-h-0">
                {members.length > 0 ? (
                    <div className="space-y-0">
                        {members.map((member) => (
                            <div
                                key={member.id}
                                className="flex gap-3 py-2 border-b border-[#F6F6F6] last:border-b-0"
                            >
                                <UserAvatar
                                    name={member.name}
                                    email={member.email}
                                    profileColor={member.profile_color}
                                    image={member.image}
                                    size="sm"
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[13px] font-medium truncate">
                                            {member.name || member.email || "Unknown"}
                                        </span>
                                        {driCounts[member.id] > 0 && (
                                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[#EEF2FF] text-[#4338CA] shrink-0">
                                                {driCounts[member.id]}
                                            </span>
                                        )}
                                    </div>
                                    {member.name && (
                                        <div className="text-[11px] text-[#B3B3B3] truncate">
                                            {member.email}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-[13px] text-[#9B9B9B] text-center py-6">
                        No members yet
                    </div>
                )}
            </div>
        </div>
    );
}
