import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { FaRegStar } from "react-icons/fa";

interface HamburgerMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function HamburgerMenu({ isOpen, onClose }: HamburgerMenuProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const location = useLocation();

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            setTimeout(() => setIsAnimating(true), 10);
            document.body.style.overflow = "hidden";
        } else {
            setIsAnimating(false);
            setTimeout(() => setIsVisible(false), 300);
            document.body.style.overflow = "";
        }
    }, [isOpen]);

    if (!isVisible) return null;

    const menuItems = [
        {
            to: "/timetable",
            icon: "/icons/app-icon/timetable.svg",
            label: "Time Table",
            activeColor: "#ffb400",
            defaultColor: "#ffffff",
        },
        {
            to: "/map",
            icon: "/icons/app-icon/map.svg",
            label: "マップ",
            activeColor: "#ffb400",
            defaultColor: "#ffffff",
        },
        {
            to: "/settings",
            icon: "/icons/app-icon/settings.svg",
            label: "設定",
            activeColor: "#ffb400",
            defaultColor: "#ffffff",
        },
    ];

    return (
        // 位置固定 左上に配置
        <div
            className={`absolute top-0 z-90 h-screen w-full bg-black/50 transition-opacity duration-300 ${isAnimating ? "opacity-100" : "opacity-0"}`}
            onClick={onClose}
        >
            <div className="relative h-full w-full">
                <div
                    className={`absolute top-0 left-0 h-full overflow-hidden transition-all duration-300 ease-out ${isAnimating ? "w-fit" : "w-0"}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex h-full min-w-fit flex-col justify-between bg-[#040b1f] pt-24 pb-6 pl-11">
                        <div
                            className={`flex flex-col gap-6 pr-7 transition-opacity delay-150 duration-200 ${isAnimating ? "opacity-100" : "opacity-0"}`}
                        >
                            {menuItems.map((item) => {
                                const isActive = location.pathname === item.to;
                                const color = isActive ? item.activeColor : item.defaultColor;

                                return (
                                    <Link
                                        key={item.to}
                                        to={item.to}
                                        className="flex cursor-pointer flex-col items-start gap-2"
                                        onClick={onClose}
                                    >
                                        <div className="flex items-center gap-3 pl-1">
                                            <div className="h-8 w-8">
                                                <img
                                                    src={item.icon}
                                                    alt=""
                                                    style={{
                                                        filter: isActive
                                                            ? "brightness(0) saturate(100%) invert(68%) sepia(76%) saturate(1711%) hue-rotate(1deg) brightness(102%) contrast(104%)"
                                                            : "none",
                                                    }}
                                                />
                                            </div>
                                            <p className="pr-10 text-lg whitespace-nowrap" style={{ color }}>
                                                {item.label}
                                            </p>
                                        </div>
                                        <div
                                            className="h-[3px] w-full rounded-full"
                                            style={{ backgroundImage: `linear-gradient(90deg, ${color}, transparent)` }}
                                        ></div>
                                    </Link>
                                );
                            })}

                            {/* 外部リンク */}
                            <a
                                href="https://www.hal.ac.jp/nagoya"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex cursor-pointer flex-col items-start gap-2"
                                onClick={onClose}
                            >
                                <div className="flex items-center gap-3 pl-1">
                                    <div className="h-8 w-8">
                                        <FaRegStar className="h-7 w-7" />
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <p className="text-lg text-white">レクサイト</p>
                                        <div className="mr-5 h-5 w-5">
                                            <img src="/icons/app-icon/link.svg" alt="" />
                                        </div>
                                    </div>
                                </div>
                                <div
                                    className="h-[3px] w-full rounded-full"
                                    style={{ backgroundImage: "linear-gradient(90deg, #ffffff, transparent)" }}
                                ></div>
                            </a>
                        </div>

                        <div
                            className={`flex w-full justify-center transition-opacity delay-150 duration-200 ${isAnimating ? "opacity-100" : "opacity-0"}`}
                        >
                            <h2 className="w-full text-5xl tracking-[2px]">recTime</h2>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
