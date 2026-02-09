import {
    Menu,
    Users,
    Calendar as CalendarIcon,
    Settings,
    ChevronDown,
} from "lucide-react";

export default function Sidebar({
    groups,
    selectedGroupId,
    setSelectedGroupId,
    activeGroupId,
}) {
    return (
        <div className="w-[230px] h-full border-r border-[#EDEDED] flex flex-col">
            <div className="h-[56px] flex items-center justify-between px-4 border-b border-[#EDEDED]">
                <div className="h-[56px] flex items-center gap-2">
                    <Menu size={20} className="text-[#5C5C5C]" />
                    <span className="text-[14px] font-medium text-[#5C5C5C]">Menu</span>
                </div>
            </div>

            <div className="flex-1 px-4 pt-4 overflow-y-auto">
                {/* Personal */}
                <div className="mb-6">
                    <button
                        onClick={() => setSelectedGroupId('personal')}
                        className={`flex items-center gap-3 w-full h-[40px] text-[14px] font-medium transition-colors ${activeGroupId === 'personal'
                                ? "text-[#2563FF] bg-blue-50 rounded-lg px-2"
                                : "text-[#7A7A7A] hover:text-[#2563FF]"
                            }`}
                    >
                        <Users size={20} />
                        <span>Personal Workspace</span>
                    </button>
                </div>

                {/* Groups */}
                <div className="mt-2">
                    <div className="flex items-center justify-between h-[40px] text-[#7A7A7A] font-medium">
                        <div className="flex items-center gap-3">
                            <Users size={20} />
                            <span>Groups</span>
                        </div>
                        <ChevronDown size={12} className="text-[#BFC2C8]" />
                    </div>

                    <div className="ml-5 mt-2 space-y-2">
                        {groups.map((group) => (
                            <button
                                key={group.id}
                                onClick={() => setSelectedGroupId(group.id)}
                                className={`flex items-center gap-2 text-[12px] w-full text-left ${activeGroupId === group.id
                                    ? "text-[#2563FF] font-medium"
                                    : ""
                                    }`}
                            >
                                <div className="w-6 h-6 rounded bg-[#F3F4F6] flex items-center justify-center text-[10px] font-semibold">
                                    {group.name.charAt(0).toUpperCase()}
                                </div>
                                <span>{group.name}</span>
                            </button>
                        ))}
                        {groups.length === 0 && (
                            <div className="text-[12px] text-[#9B9B9B]">No groups yet</div>
                        )}
                    </div>
                </div>

                {/* Calendar */}
                <div className="mt-6">
                    <a
                        href="/calendar"
                        className="flex items-center gap-3 h-[40px] text-[#7A7A7A] font-medium hover:text-[#2563FF]"
                    >
                        <CalendarIcon size={20} />
                        <span>Calendar</span>
                    </a>
                </div>

                {/* Groups Management */}
                <div className="mt-6">
                    <a
                        href="/groups"
                        className="flex items-center gap-3 h-[40px] text-[#7A7A7A] font-medium hover:text-[#2563FF]"
                    >
                        <Settings size={20} />
                        <span>Manage Groups</span>
                    </a>
                </div>
            </div>
        </div>
    );
}
