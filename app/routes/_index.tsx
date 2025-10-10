import { useEffect } from "react";
import { useNavigate } from "react-router";

// トップページにアクセスしたら /timetable にリダイレクトする
export default function Index() {
    const navigate = useNavigate();

    useEffect(() => {
        // 即座にリダイレクト（遅延なし）
        navigate("/timetable", { replace: true });
    }, [navigate]);

    // ローディング表示を出すことで、このコンポーネントのJSが確実に読み込まれ、キャッシュされる
    return (
        <div className="flex h-full items-center justify-center">
            <div className="text-white">Loading...</div>
        </div>
    );
}
