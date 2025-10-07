import React from "react";
import { Link } from "react-router";

export default function DevNavigation() {
    return (
        <div className="TemporaryContainer fixed right-2 bottom-2 z-50 flex h-auto w-auto flex-col items-center gap-1 rounded-sm border-2 border-solid border-[#ff8d07] bg-black p-1">
            <Link to="/" className="flex w-full cursor-pointer justify-center rounded-sm px-2 py-1 hover:bg-gray-800">
                <span className="text-white">root</span>
            </Link>
            <Link
                to="/timetable"
                className="flex w-full cursor-pointer justify-center rounded-sm px-2 py-1 hover:bg-gray-800"
            >
                <span className="text-white">timetable</span>
            </Link>
            <Link
                to="/settings"
                className="flex w-full cursor-pointer justify-center rounded-sm px-2 py-1 hover:bg-gray-800"
            >
                <span className="text-white">settings</span>
            </Link>
            <Link
                to="/register/student-id"
                className="flex w-full cursor-pointer justify-center rounded-sm px-2 py-1 hover:bg-gray-800"
            >
                <span className="text-white">student-id</span>
            </Link>
            <Link
                to="/map"
                className="flex w-full cursor-pointer justify-center rounded-sm px-2 py-1 hover:bg-gray-800"
            >
                <span className="text-white">map</span>
            </Link>
            <Link
                to="/home"
                className="flex w-full cursor-pointer justify-center rounded-sm px-2 py-1 hover:bg-gray-800"
            >
                <span className="text-white">home</span>
            </Link>
        </div>
    );
}
