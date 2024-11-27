import Link from "next/link";
import { UsersIcon, StickerIcon, PencilIcon } from "lucide-react";

interface BoardCardProps {
  id: string;
  title: string;
  userCount: number;
  strokeCount: number;
  stickerCount: number;
}

export const BoardCard = ({
  id,
  title,
  userCount,
  strokeCount,
  stickerCount,
}: BoardCardProps) => {
  return (
    <Link
      href={`/board/${id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative bg-gray-50 aspect-[100/127] rounded-lg hover:bg-gray-100 transition border border-gray-200"
    >
      <div className="absolute inset-0 p-4 flex flex-col">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900">{title}</h3>
        </div>
        <div className="flex items-center gap-x-2 text-gray-600">
          <div className="flex items-center gap-x-1">
            <UsersIcon className="h-4 w-4" />
            <span className="text-xs">{userCount}</span>
          </div>
          <div className="flex items-center gap-x-1">
            <PencilIcon className="h-4 w-4" />
            <span className="text-xs">{strokeCount}</span>
          </div>
          <div className="flex items-center gap-x-1">
            <StickerIcon className="h-4 w-4" />
            <span className="text-xs">{stickerCount}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};
