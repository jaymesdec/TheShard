export default function MemberList({ members }) {
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
                                <div className="w-7 h-7 rounded-full bg-[#2563FF] flex items-center justify-center text-white text-[11px] font-semibold flex-shrink-0">
                                    {(member.name || member.email).charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <div className="text-[13px] font-medium">
                                        {member.name || member.email}
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
