import { Link } from "@tanstack/react-router";
import {
	Boxes,
	HardDrive,
	FolderOpen,
	ScrollText,
	TerminalSquare,
	Home,
	Menu,
	X,
} from "lucide-react";
import { useState } from "react";

export function SidebarLayout() {
	const [open, setOpen] = useState(false);

	return (
		<>
			{/* Toggle Button */}
			<button
				className="sm:hidden fixed top-4 left-4 z-40 p-2 bg-gray-900 text-white rounded-md shadow-lg"
				onClick={() => setOpen((o) => !o)}
			>
				{open ? <X size={20} /> : <Menu size={20} />}
			</button>

			{/* Sidebar */}
			<aside
				className={`
					fixed z-40 sm:static h-full w-64 bg-gray-900 text-white flex flex-col justify-between
					transform transition-transform duration-300
					${open ? "translate-x-0" : "-translate-x-full"} sm:translate-x-0
				`}
			>
				<div>
					<div className="p-4 text-lg font-bold border-b border-gray-700">
						Docker Dashboard
					</div>
					<nav className="flex flex-col gap-1 p-2">
						<NavItem to="/" icon={<Home size={20} />} onClick={() => setOpen(false)}>
							Dashboard
						</NavItem>
						<NavItem to="/containers" icon={<Boxes size={20} />} onClick={() => setOpen(false)}>
							Containers
						</NavItem>
						<NavItem to="/images" icon={<HardDrive size={20} />} onClick={() => setOpen(false)}>
							Images
						</NavItem>
						<NavItem to="/volumes" icon={<FolderOpen size={20} />} onClick={() => setOpen(false)}>
							Volumes
						</NavItem>
						<NavItem to="/logs" icon={<ScrollText size={20} />} onClick={() => setOpen(false)}>
							Logs
						</NavItem>
					</nav>
				</div>

				<div className="p-2 border-t border-gray-700">
					<NavItem
						to="/check-process"
						icon={<TerminalSquare size={20} />}
						className="text-red-400 hover:text-red-300"
						onClick={() => setOpen(false)}
					>
						Check Docker Process
					</NavItem>
				</div>
			</aside>

			{/* Overlay */}
			{open && (
				<div
					className="fixed inset-0 bg-black bg-opacity-30 z-30 sm:hidden"
					onClick={() => setOpen(false)}
				/>
			)}
		</>
	);
}

function NavItem({
	to,
	icon,
	children,
	className = "",
	onClick,
}: {
	to: string,
	icon: React.ReactNode,
	children: React.ReactNode,
	className?: string,
	onClick?: ()=> void,
}) {
	return (
		<Link
			to={to}
			onClick={onClick}
			className={`flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-800 transition-colors ${className}`}
		>
			{icon}
			<span>{children}</span>
		</Link>
	);
}
