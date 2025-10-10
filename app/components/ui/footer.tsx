import React from "react";

export default function footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="mt-5 flex w-full flex-col justify-center bg-white px-2 pb-2">
            <div className="flex w-full justify-center">
                <p className="text-sm text-blue-950">
                    &copy; {currentYear} HAL, Inc. ALL RIGHTS RESERVED.
                </p>
            </div>
        </footer>
    );
}
