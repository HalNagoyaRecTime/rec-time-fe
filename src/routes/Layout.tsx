import { type ReactNode } from "react"
import { HamburgerMenu } from "../components/hamburger-menu"

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <>
      <HamburgerMenu />
      {children}
    </>
  )
}
