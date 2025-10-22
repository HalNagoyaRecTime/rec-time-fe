import { useEffect } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/_index";

export const meta: Route.MetaFunction = () => {
    return [
        { title: "recTime - レクリエーション呼び出しアプリ" },
    ];
};

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
