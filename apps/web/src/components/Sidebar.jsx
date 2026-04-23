import { useState } from "react";
import {
    Menu,
    Users,
    Calendar as CalendarIcon,
    Settings,
    User,
    ChevronDown,
    FileText,
    X,
} from "lucide-react";

export default function Sidebar({
    groups,
    selectedGroupId,
    setSelectedGroupId,
    activeGroupId,
    onLeaveGroup,
}) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div
            className={`h-full border-r border-[#EDEDED] flex flex-col transition-all duration-200 ${
                collapsed ? "w-[60px]" : "w-[230px]"
            }`}
        >
            <div className="h-[56px] flex items-center justify-between px-4 border-b border-[#EDEDED]">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="h-[56px] flex items-center gap-2 hover:text-[#2563FF] transition-colors"
                >
                    <Menu size={20} className="text-[#5C5C5C] shrink-0" />
                    {!collapsed && (
                        <span className="text-[14px] font-medium text-[#5C5C5C]">Menu</span>
                    )}
                </button>
            </div>

            <div className="flex-1 px-2 pt-4 overflow-y-auto overflow-x-hidden">
                {/* Personal */}
                <div className="mb-6">
                    <button
                        onClick={() => setSelectedGroupId('personal')}
                        title="Personal Workspace"
                        className={`flex items-center gap-3 w-full h-[40px] text-[14px] font-medium transition-colors rounded-lg px-2 ${
                            activeGroupId === 'personal'
                                ? "text-[#2563FF] bg-blue-50"
                                : "text-[#7A7A7A] hover:text-[#2563FF]"
                        }`}
                    >
                        <Users size={20} className="shrink-0" />
                        {!collapsed && <span className="truncate">Personal Workspace</span>}
                    </button>
                    <a
                        href="/notes"
                        title="Notes & Reminders"
                        className={`flex items-center gap-3 w-full h-[36px] text-[13px] font-medium transition-colors rounded-lg ${
                            collapsed ? "px-2 justify-center" : "pl-7 pr-2"
                        } text-[#7A7A7A] hover:text-[#2563FF]`}
                    >
                        <FileText size={16} className="shrink-0" />
                        {!collapsed && <span className="truncate">Notes & Reminders</span>}
                    </a>
                </div>

                {/* Groups */}
                <div className="mt-2">
                    <div className="flex items-center justify-between h-[40px] text-[#7A7A7A] font-medium px-2">
                        <div className="flex items-center gap-3">
                            <Users size={20} className="shrink-0" />
                            {!collapsed && <span>Groups</span>}
                        </div>
                        {!collapsed && <ChevronDown size={12} className="text-[#BFC2C8]" />}
                    </div>

                    {!collapsed && (
                        <div className="ml-5 mt-2 space-y-2">
                            {groups.map((group) => (
                                <div
                                    key={group.id}
                                    className={`group/item flex items-center gap-2 text-[12px] w-full ${
                                        activeGroupId === group.id
                                            ? "text-[#2563FF] font-medium"
                                            : ""
                                    }`}
                                >
                                    <button
                                        onClick={() => setSelectedGroupId(group.id)}
                                        className="flex items-center gap-2 flex-1 min-w-0 text-left"
                                    >
                                        <div className="w-6 h-6 rounded bg-[#F3F4F6] flex items-center justify-center text-[10px] font-semibold shrink-0">
                                            {(group.name || '?').charAt(0).toUpperCase()}
                                        </div>
                                        <span className="truncate">{group.name}</span>
                                    </button>
                                    {onLeaveGroup && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm("Leave this group? It will be removed from your view but remain active for other members.")) {
                                                    onLeaveGroup(group.id);
                                                }
                                            }}
                                            className="opacity-0 group-hover/item:opacity-100 p-1 hover:bg-red-50 rounded transition-opacity shrink-0"
                                            title="Leave group"
                                        >
                                            <X size={12} className="text-red-500" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            {groups.length === 0 && (
                                <div className="text-[12px] text-[#9B9B9B]">No groups yet</div>
                            )}
                        </div>
                    )}

                    {collapsed && groups.map((group) => (
                        <button
                            key={group.id}
                            onClick={() => setSelectedGroupId(group.id)}
                            title={group.name}
                            className={`flex items-center justify-center w-full h-[36px] rounded-lg mb-1 ${
                                activeGroupId === group.id
                                    ? "text-[#2563FF] bg-blue-50 font-medium"
                                    : "text-[#7A7A7A] hover:bg-[#F5F5F5]"
                            }`}
                        >
                            <div className="w-6 h-6 rounded bg-[#F3F4F6] flex items-center justify-center text-[10px] font-semibold">
                                {(group.name || '?').charAt(0).toUpperCase()}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Calendar */}
                <div className="mt-6">
                    <a
                        href="/calendar"
                        title="Calendar"
                        className="flex items-center gap-3 h-[40px] text-[#7A7A7A] font-medium hover:text-[#2563FF] px-2 rounded-lg"
                    >
                        <CalendarIcon size={20} className="shrink-0" />
                        {!collapsed && <span>Calendar</span>}
                    </a>
                </div>
                {/* Groups Management */}
                <div className="mt-6">
                    <a
                        href="/groups"
                        title="Manage Groups"
                        className="flex items-center gap-3 h-[40px] text-[#7A7A7A] font-medium hover:text-[#2563FF] px-2 rounded-lg"
                    >
                        <Settings size={20} className="shrink-0" />
                        {!collapsed && <span>Manage Groups</span>}
                    </a>
                </div>
                {/* Profile */}
                <div className="mt-2">
                    <a
                        href="/account/profile"
                        title="Profile"
                        className="flex items-center gap-3 h-[40px] text-[#7A7A7A] font-medium hover:text-[#2563FF] px-2 rounded-lg"
                    >
                        <User size={20} className="shrink-0" />
                        {!collapsed && <span>Profile</span>}
                    </a>
                </div>
            </div>
        </div>
    );
}
