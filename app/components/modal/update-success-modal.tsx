// app/components/ui/update-success-modal.tsx

interface UpdateSuccessModalProps {
    onClose: () => void;
}

export default function UpdateSuccessModal({ onClose }: UpdateSuccessModalProps) {
    return (
        <div className="fixed inset-0 z-[10000] flex h-screen w-full items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-[90%] max-w-md rounded-lg border-1 bg-white p-6 shadow-2xl shadow-lg">
                <div className="mb-6 text-center">
                    <h2 className="text-xl font-bold text-gray-800">アップデート完了</h2>
                    <p className="mt-2 text-sm text-gray-600">最新バージョンに更新されました</p>
                </div>
                <button
                    onClick={onClose}
                    className="w-full cursor-pointer rounded-lg bg-green-600 py-3 text-base font-bold text-white transition-colors hover:bg-green-700 active:bg-green-800"
                >
                    OK
                </button>
            </div>
        </div>
    );
}
