import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check } from "lucide-react";
import useUser from "@/utils/useUser";
import UserAvatar from "@/components/UserAvatar";

const COLOR_PALETTE = [
  { hex: '#2563FF', label: 'Blue' },
  { hex: '#7C3AED', label: 'Violet' },
  { hex: '#DB2777', label: 'Pink' },
  { hex: '#DC2626', label: 'Red' },
  { hex: '#EA580C', label: 'Orange' },
  { hex: '#CA8A04', label: 'Amber' },
  { hex: '#16A34A', label: 'Green' },
  { hex: '#0D9488', label: 'Teal' },
  { hex: '#0891B2', label: 'Cyan' },
  { hex: '#4338CA', label: 'Indigo' },
  { hex: '#6D28D9', label: 'Purple' },
  { hex: '#9333EA', label: 'Fuchsia' },
];

export default function ProfilePage() {
  const { data: user, loading: userLoading } = useUser();
  const queryClient = useQueryClient();
  const [selectedColor, setSelectedColor] = useState(null);

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const response = await fetch("/api/users/profile");
      if (!response.ok) throw new Error("Failed to fetch profile");
      return response.json();
    },
    enabled: !!user,
  });

  const currentColor = selectedColor ?? profileData?.profile_color ?? '#2563FF';
  const hasChanges = selectedColor && selectedColor !== (profileData?.profile_color ?? '#2563FF');

  const updateColorMutation = useMutation({
    mutationFn: async (color) => {
      const response = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_color: color }),
      });
      if (!response.ok) throw new Error("Failed to update color");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["userProfile"], (old) => ({
        ...old,
        profile_color: data.profile_color,
      }));
      setSelectedColor(null);
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });

  const handleSave = () => {
    if (selectedColor) {
      updateColorMutation.mutate(selectedColor);
    }
  };

  if (userLoading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/account/signin";
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 font-inter">
      <div className="max-w-xl mx-auto p-8">
        <div className="mb-8">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-[#2563FF] font-medium mb-4 hover:text-[#2E69DE]"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </a>
          <h1 className="text-3xl font-bold text-gray-800">Profile</h1>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg">
          {/* User info + live preview */}
          <div className="flex items-center gap-4 mb-8">
            <UserAvatar
              name={user.name}
              email={user.email}
              profileColor={currentColor}
              size="md"
            />
            <div>
              <div className="font-semibold text-gray-800 text-lg">
                {user.name || "No name set"}
              </div>
              <div className="text-sm text-gray-500">{user.email}</div>
            </div>
          </div>

          {/* Color picker */}
          <div>
            <h2 className="text-sm font-semibold text-gray-600 mb-4">
              Profile Color
            </h2>
            <div className="grid grid-cols-4 gap-3 mb-6">
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color.hex}
                  onClick={() => setSelectedColor(color.hex)}
                  className={`relative w-full aspect-square rounded-xl transition-all ${
                    currentColor === color.hex
                      ? "ring-2 ring-offset-2 ring-gray-400 scale-105"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.label}
                >
                  {currentColor === color.hex && (
                    <Check
                      size={20}
                      className="absolute inset-0 m-auto text-white"
                    />
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={handleSave}
              disabled={!hasChanges || updateColorMutation.isPending}
              className="w-full px-6 py-3 bg-[#2563FF] text-white rounded-lg font-medium hover:bg-[#2E69DE] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateColorMutation.isPending ? "Saving..." : "Save"}
            </button>

            {updateColorMutation.isSuccess && !hasChanges && (
              <p className="text-sm text-green-600 mt-2 text-center">
                Color updated!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
