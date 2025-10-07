import { useEffect } from "react";
import { useNavigate } from "react-router";
// トップページにアクセスしたら /timetable にリダイレクトする
export default function Index() {
    const navigate = useNavigate();

    useEffect(() => {
        navigate("/timetable", { replace: true });
    }, [navigate]);

    return null;
}
