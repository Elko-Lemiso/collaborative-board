import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useBoards } from "@/lib/hooks/useBoards";
import { Dialog } from "@headlessui/react";

interface CreateBoardProps {
  disabled?: boolean;
}

export const CreateBoard = ({ disabled }: CreateBoardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [boardName, setBoardName] = useState("");
  const { createBoard } = useBoards();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (boardName.trim()) {
      createBoard(boardName.trim());
      setBoardName("");
      setIsOpen(false);
    }
  };

  return (
    <>
      <button
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        className="aspect-[100/127] rounded-lg flex flex-col items-center justify-center 
                   bg-gray-50 hover:bg-gray-100 transition group relative overflow-hidden
                   border-2 border-dashed border-gray-300
                   disabled:cursor-not-allowed disabled:opacity-50"
      >
        <div className="flex flex-col items-center gap-y-4">
          <div className="p-2 rounded-full bg-white group-hover:bg-gray-50">
            <Plus className="h-6 w-6 text-gray-600" />
          </div>
          <span className="text-gray-600 font-semibold">Create new board</span>
        </div>
      </button>

      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="relative z-50"

      >
        {/* The backdrop */}
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        {/* Full-screen container */}
        <div className="fixed inset-0 flex items-center justify-center p-10">
          {/* The actual dialog */}
          <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-semibold">
                Create new board
              </Dialog.Title>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="boardName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Board name
                </label>
                <input
                  type="text"
                  id="boardName"
                  value={boardName}
                  onChange={(e) => setBoardName(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 
                           text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter board name"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-semibold 
                           text-gray-900 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!boardName.trim()}
                  className="rounded-md bg-orange-600 px-3 py-2 text-sm 
                           font-semibold text-white hover:bg-orange-500 
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
};
