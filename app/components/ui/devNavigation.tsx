import React from "react";
import { Link } from "react-router";

export default function DevNavigation() {
    return (
        <div className="TemporaryContainer fixed bottom-2 left-2 z-50 flex h-auto w-auto flex-col items-center gap-1 rounded-sm border-2 border-solid border-[#ff8d07] bg-black p-1">
            <Link to="/" className="cursor-pointer rounded-sm px-2 py-1 hover:bg-gray-800">
                <span className="text-white">root</span>
            </Link>
            <Link to="/timetable" className="cursor-pointer rounded-sm px-2 py-1 hover:bg-gray-800">
                timetable
            </Link>
            <Link to="/check-in" className="cursor-pointer rounded-sm px-2 py-1 hover:bg-gray-800">
                <span className="text-white">check-in</span>
            </Link>
            <Link to="/settings" className="cursor-pointer rounded-sm px-2 py-1 hover:bg-gray-800">
                settings
            </Link>
            <Link to="/map" className="cursor-pointer rounded-sm px-2 py-1 hover:bg-gray-800">
                map
            </Link>
            <Link to="/home" className="cursor-pointer rounded-sm px-2 py-1 hover:bg-gray-800">
                home
            </Link>
        </div>
    );
}
