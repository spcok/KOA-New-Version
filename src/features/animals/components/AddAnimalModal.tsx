import React from 'react';

export function AddAnimalModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl">
        <h2>Add Animal Module (Coming Soon)</h2>
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-200 rounded">Close</button>
      </div>
    </div>
  );
}