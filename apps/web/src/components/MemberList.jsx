import UserAvatar from "@/components/UserAvatar";

export default function MemberList({ members, driCounts = {} }) {
    return (
        <div className="w-[300px] h-full border-l border-[#EDEDED] flex flex-col">
            <div className="h-[64px] flex items-center px-6 border-b border-[#EDEDED] bg-white">
                <h3 className="text-[13px] font-semibold">Group Members</h3>
            </div>

            <div className="px-6 pt-6 overflow-y-auto">
                {members.length > 0 ? (
                    <div className="space-y-0">
                        {members.map((member) => (
                            <div
                                key={member.id}
                                className="flex gap-3 py-3 border-b border-[#F6F6F6]"
                            >
                                <UserAvatar
                                    name={member.name}
                                    email={member.email}
                                    profileColor={member.profile_color}
                                    image={member.image}
                                    size="sm"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[13px] font-medium">
                                            {member.name || member.email || 'Unknown'}
                                        </span>
                                        {driCounts[member.id] > 0 && (
                                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[#EEF2FF] text-[#4338CA]">
                                                {driCounts[member.id]} {driCounts[member.id] === 1 ? 'task' : 'tasks'}
                                            </span>
                                        )}
                                    </div>
                                    {member.name && (
                                        <div className="text-[11px] text-[#B3B3B3]">
                                            {member.email}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-[13px] text-[#9B9B9B] text-center py-8">
                        No members yet
                    </div>
                )}
            </div>
        </div>
    );
}
