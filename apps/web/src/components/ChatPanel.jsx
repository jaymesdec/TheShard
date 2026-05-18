import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, X, Send } from "lucide-react";
import { toast } from "sonner";
import ImageUploader from "@/components/ImageUploader";
import Lightbox from "@/components/Lightbox";

const formatTime = (isoString) =>
    new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function ChatPanel({ groupId, currentUser }) {
    const queryClient = useQueryClient();
    const [message, setMessage] = useState("");
    const [pendingImages, setPendingImages] = useState([]);
    const [lightboxImage, setLightboxImage] = useState(null);
    const scrollRef = useRef(null);

    const { data: messagesData } = useQuery({
        queryKey: ["messages", groupId],
        queryFn: async () => {
            const response = await fetch(`/api/groups/${groupId}/messages`);
            if (!response.ok) throw new Error("Failed to fetch messages");
            return response.json();
        },
        enabled: !!groupId,
        refetchInterval: 2000,
    });

    const messages = messagesData?.messages || [];

    const sendMessageMutation = useMutation({
        mutationFn: async ({ content, images }) => {
            const response = await fetch(`/api/groups/${groupId}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content, images, userId: currentUser.id }),
            });
            if (!response.ok) throw new Error("Failed to send message");
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["messages", groupId] });
            setMessage("");
            setPendingImages([]);
        },
    });

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages.length]);

    const handleSend = (event) => {
        event.preventDefault();
        if (!message.trim() && pendingImages.length === 0) return;
        sendMessageMutation.mutate({ content: message, images: pendingImages });
    };

    const handleImageUploaded = ({ url }) => {
        if (pendingImages.length >= 10) {
            toast.error("Maximum 10 images per message");
            return;
        }
        setPendingImages((prev) => [...prev, { url }]);
    };

    const removePendingImage = (index) => {
        setPendingImages((prev) => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="flex-1 min-h-0 flex flex-col border-t border-[#EDEDED]">
            <div className="h-[40px] flex items-center px-6 border-b border-[#EDEDED] bg-white shrink-0">
                <h3 className="text-[13px] font-semibold">Chat</h3>
            </div>

            <div
                ref={scrollRef}
                className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-2 bg-[#FAFAFA]"
            >
                {messages.length === 0 ? (
                    <div className="text-center text-[#9B9B9B] text-[12px] mt-8">
                        No messages yet. Say hello!
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isSelf = msg.user_id === currentUser.id;
                        return (
                            <div
                                key={msg.id}
                                className={`flex flex-col ${isSelf ? "items-end" : "items-start"}`}
                            >
                                {!isSelf && (
                                    <div className="text-[10px] font-semibold text-[#7A7A7A] mb-0.5 px-1">
                                        {msg.user_name}
                                    </div>
                                )}
                                <div
                                    className={`max-w-[85%] rounded-2xl px-3 py-1.5 text-[12px] leading-snug shadow-sm ${
                                        isSelf
                                            ? "bg-[#2563FF] text-white rounded-tr-sm"
                                            : "bg-white border border-[#EDEDED] text-[#2B2B2B] rounded-tl-sm"
                                    }`}
                                >
                                    {msg.content && <div className="whitespace-pre-wrap break-words">{msg.content}</div>}
                                    {msg.images?.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                                            {msg.images.map((img, idx) => (
                                                <img
                                                    key={idx}
                                                    src={img.url}
                                                    alt=""
                                                    className="w-[80px] h-[60px] object-cover rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                                                    onClick={() => setLightboxImage(img.url)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="text-[9px] text-[#B3B3B3] mt-0.5 px-1">
                                    {formatTime(msg.created_at)}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {pendingImages.length > 0 && (
                <div className="flex flex-wrap gap-1.5 px-3 py-2 border-t border-[#EDEDED] bg-white shrink-0">
                    {pendingImages.map((img, idx) => (
                        <div key={idx} className="relative group">
                            <img
                                src={img.url}
                                alt=""
                                className="w-[44px] h-[44px] object-cover rounded-md border border-gray-200"
                            />
                            <button
                                type="button"
                                onClick={() => removePendingImage(idx)}
                                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove"
                            >
                                <X size={10} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <form
                onSubmit={handleSend}
                className="flex items-center gap-1 px-3 py-2 border-t border-[#EDEDED] bg-white shrink-0"
            >
                <ImageUploader onImageUploaded={handleImageUploaded} disabled={sendMessageMutation.isPending}>
                    {({ triggerFileInput, uploading }) => (
                        <button
                            type="button"
                            onClick={triggerFileInput}
                            disabled={uploading || sendMessageMutation.isPending}
                            className="p-1.5 text-gray-400 hover:text-[#2563FF] disabled:opacity-50 transition-colors shrink-0"
                            title="Attach image"
                        >
                            <ImagePlus size={16} />
                        </button>
                    )}
                </ImageUploader>
                <input
                    type="text"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 min-w-0 px-2 py-1.5 text-[12px] border border-[#EDEDED] rounded-lg outline-none focus:border-[#2563FF]"
                />
                <button
                    type="submit"
                    disabled={(!message.trim() && pendingImages.length === 0) || sendMessageMutation.isPending}
                    className="p-1.5 bg-[#2563FF] text-white rounded-lg disabled:opacity-40 hover:bg-[#2E69DE] transition-colors shrink-0"
                    title="Send"
                >
                    <Send size={14} />
                </button>
            </form>

            <Lightbox
                imageUrl={lightboxImage}
                isOpen={!!lightboxImage}
                onClose={() => setLightboxImage(null)}
            />
        </div>
    );
}
