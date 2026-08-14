import type { ReactNode } from 'react';

export function PageHeading({ icon, title, description, accentClassName, actions }: { icon: ReactNode; title: string; description: string; accentClassName: string; actions?: ReactNode }) {
	return (
		<header className="mb-6 flex items-center justify-between gap-5 max-[760px]:items-start">
			<div className="flex min-w-0 items-center gap-3.5">
				<div className={`grid size-11 shrink-0 place-items-center border border-(--vscode-widget-border) ${accentClassName}`}>{icon}</div>
				<div className="min-w-0">
					<h1 className="m-0 text-2xl font-semibold">{title}</h1>
					<p className="mt-1 mb-0 text-[13px] text-(--vscode-descriptionForeground) max-[760px]:hidden">{description}</p>
				</div>
			</div>
			{actions}
		</header>
	);
}