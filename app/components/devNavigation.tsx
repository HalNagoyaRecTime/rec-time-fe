import React from "react";
import {Link} from "react-router";

export default function DevNavigation() {
    return (
        <div className="TemporaryContainer fixed bottom-2 flex flex-col items-center gap-1 left-2 w-auto p-1 h-auto bg-black rounded-sm border-[#ff8d07] border-2 border-solid z-50">
            <Link to="/" className="py-1 hover:bg-gray-800 rounded-sm cursor-pointer px-2 ">
                <span className="text-white">home</span>
            </Link>
            <Link to="/schedule" className="py-1 hover:bg-gray-800 rounded-sm cursor-pointer px-2">
                <span className="text-white">schedule</span>
            </Link>
            <Link to="/id-input" className="py-1 hover:bg-gray-800 rounded-sm cursor-pointer px-2">
                <span className="text-white">id-input</span>
            </Link>
            <Link to="/settings" className="py-1 hover:bg-gray-800 rounded-sm cursor-pointer px-2">
                settings
            </Link>
            <Link to="/map" className="py-1 hover:bg-gray-800 rounded-sm cursor-pointer px-2">
                map
            </Link>
        </div>
    )
}